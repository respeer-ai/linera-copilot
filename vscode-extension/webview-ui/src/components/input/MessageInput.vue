<template>
  <q-input v-model="message" type="textarea" autogrow :min-rows="4" :max-rows="6" class="message-input"
    style="min-height: 128px; max-height: 200px; border: 1px solid #ccc;" @keydown.enter.prevent="sendMessage">
    <template v-slot:append>
      <q-btn round dense flat icon="send" @click="sendMessage" class="send-button" />
    </template>
  </q-input>
</template>

<script setup>
import { ref } from 'vue';

const message = ref('');

const sendMessage = () => {
  if (message.value.trim()) {
    // Handle send message logic here
    console.log('Message sent:', message.value);
    message.value = '';
  }
};
</script>

<style scoped>
.message-input {
  padding-right: 40px;
  /* Make space for the button */
  border-radius: 8px;
}

.send-button {
  position: absolute;
  right: 8px;
  bottom: 8px;
}
</style>
