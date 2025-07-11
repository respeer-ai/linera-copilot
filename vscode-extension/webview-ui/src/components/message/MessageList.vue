<template>
  <q-list class="message-list">
    <q-item dense v-for="(message, index) in messages" :key="index"
      :class="{'user-message': message.sender === 'user', 'llm-message': message.sender === 'llm' }">
      <q-item-section>
        <div v-if="message.sender === 'user'" class="user-message-content full-width text-grey" @mouseenter="showCopyButton = true"
          @mouseleave="showCopyButton = false">
          <span v-html="lineFeed2Br(message.content)" />
          <q-btn v-show="showCopyButton" flat round icon="content_copy" size="0.4rem"
            @click="copyMessage(message.content)" />
        </div>
        <div v-else-if='isHtml(message.content)' v-html="message.content" />
        <div v-else class="markdown-body" v-html='renderMarkdown(message.content)' />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import type { Message } from './Message';
import { NotifyManager } from '../../notify'
import { useQuasar } from 'quasar';
import { marked } from 'marked';

const $q = useQuasar();

const props = defineProps<{
  messages: Message[];
}>();
const messages = toRef(props, 'messages');

const showCopyButton = ref(false);

const isHtml = (content: string): boolean => {
  if (typeof content !== 'string') return false

  const doc = new DOMParser().parseFromString(content, 'text/html')

  // 过滤掉纯空白、注释等无效节点
  const nodes = Array.from(doc.body.childNodes).filter(node => {
    return node.nodeType === 1 || (node.nodeType === 3 && node.textContent?.trim())
  })

  // 至少有 1 个元素节点，且不全是纯文本
  const hasElement = nodes.some(node => node.nodeType === 1)
  const hasText = nodes.some(node => node.nodeType === 3)

  // 优先判断：有元素 且 不只是纯文本
  if (hasElement && !hasText) {
    return true
  }

  // 容错：匹配典型 HTML 标签
  const htmlPattern = /<([a-z]+)(\s|>)/i
  if (htmlPattern.test(content)) {
    return true
  }

  return false
}

const lineFeed2Br = (content: string) => {
  return content.replace(/\n/g, '<br>');
}

const renderMarkdown = (content: string) => {
  return marked.parse(content);
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content);
  NotifyManager.showSuccess($q, 'Copied to clipboard')
};
</script>

<style scoped>
.message-list {
  max-width: 100%;
}

.user-message {
  justify-content: flex-end;
  margin-bottom: 16px;
  margin-top: 16px;
}

.llm-message {
  justify-content: flex-start;
  margin-bottom: 16px;
  margin-top: 16px;
}

.user-message-content {
  background-color: rgba(100, 100, 100, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

/* 确保 markdown-body 类的样式正确应用 */
:deep(.markdown-body) {
  background-color: transparent;
  color: inherit;
}

.markdown-body .highlight pre, .markdown-body pre {
  color: #f6f8fa;
  background-color: #1f2328;
}

.markdown-body table tr, tr:nth-child(2n)  {
  background-color: #1f2328;
}
</style>