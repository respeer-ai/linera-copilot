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

const isHtml = (content: string) => {
  const doc = new DOMParser().parseFromString(content, 'text/html');
  return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
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
}

.llm-message {
  justify-content: flex-start;
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
</style>