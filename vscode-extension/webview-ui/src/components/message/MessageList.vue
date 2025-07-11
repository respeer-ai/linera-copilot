<template>
  <q-list class="message-list">
    <q-item v-for="(message, index) in messages" :key="index"
      :class="{ 'user-message': message.sender === 'user', 'llm-message': message.sender === 'llm' }">
      <q-item-section>
        <div v-if="message.sender === 'user'" class="user-message-content" @mouseenter="showCopyButton = true"
          @mouseleave="showCopyButton = false">
          {{ message.content }}
          <q-btn v-show="showCopyButton" flat round icon="content_copy" class="copy-button"
            @click="copyMessage(message.content)" />
        </div>
        <div v-else v-html="renderLlmContent(message.content)" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';

interface Message {
  sender: 'user' | 'llm';
  content: string;
}

const props = defineProps<{
  messages: Message[];
}>();
const messages = toRef(props, 'messages');

const showCopyButton = ref(false);

const renderLlmContent = (content: string) => {
  // Simple heuristic to decide between markdown and html
  if (content.includes('<') && content.includes('>')) {
    return content; // Treat as HTML
  } else {
    // In a real app, you would use a markdown renderer here
    return content.replace(/\n/g, '<br>'); // Simple line breaks for demo
  }
};

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content);
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
  background-color: rgba(100, 100, 255, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 70%;
  cursor: pointer;
}

.copy-button {
  position: absolute;
  right: -8px;
  top: -8px;
}
</style>
