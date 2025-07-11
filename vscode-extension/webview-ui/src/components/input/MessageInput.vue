<template>
  <q-input v-model="message" type="textarea" outlined rounded dark autogrow :max-rows="6"
    style="max-height: 200px;" @keydown.enter.prevent="sendMessage" placeholder="Type your task here...">
    <template v-slot:append>
      <q-btn round dense flat icon="send" @click="sendMessage" class="send-button" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('');

const emit = defineEmits(['send']);

const sendMessage = () => {
  if (message.value.trim()) {
    emit('send', message.value);
    message.value = '';
  }
};
</script>

<style scoped>
.send-button {
  position: absolute;
  right: 8px;
  bottom: 8px;
}
</style>