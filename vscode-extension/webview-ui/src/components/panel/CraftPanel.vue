<template>
  <div class="flex justify-center align-center flex-column full-height">
    <div :style='{height: bodyHeight}' v-if='!chatting' class='flex flex-center justify-center align-center full-width'>
      <div class='full-width'>
        <div class="text-h6 text-center" style="margin-top: 48px;">
          Create Reactive & Realtime dApps with Linera Microchain
        </div>

        <div class="row justify-center q-mt-md flex-1">
          <div class="full-width" v-for="(card, index) in cards" :key="index" @click="onActionCardClick(card)">
            <q-card flat class="q-pa-md cursor-pointer full-width bg-transparent row q-mt-sm items-center">
              <q-icon :name="card.icon" size="1.2rem" class="q-mr-md" />
              <div class="text-normal text-weight-medium q-mr-sm">{{ card.title }}</div>
              <div class="text-caption text-grey">{{ card.subtitle }}</div>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div v-else :style='{height: bodyHeight}'>
      <MessageList :messages="messages" />
    </div>

    <div class="q-my-sm q-mx-md fixed-bottom q-pa-sm">
      <MessageInput />
      <q-resize-observer @resize="onMessageInputResize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Message } from '../message/Message';

import MessageInput from '../input/MessageInput.vue';
import MessageList from '../message/MessageList.vue';

const cards = ref([
  {
    icon: 'gamepad',
    title: 'Create a 2048 game',
    subtitle: 'Build a classic 2048 game with Linera'
  },
  {
    icon: 'calculate',
    title: 'Create a counter program',
    subtitle: 'Develop a simple counter application'
  },
  {
    icon: 'info',
    title: 'Explain project',
    subtitle: 'Get detailed explanations of your project'
  },
  {
    icon: 'play_arrow',
    title: 'Execute project',
    subtitle: 'Run and test your dApp in real-time'
  }
]);

const bodyHeight = ref('0px')
const chatting = ref(false)
const messages = ref([] as Message[])

const onMessageInputResize = (size: { height: number; }) => {
  bodyHeight.value = `${window.innerHeight - size.height - 48}px`
}

const onActionCardClick = (card: { title: any; subtitle: any; }) => {
  chatting.value = true
  const prompt = `Break down the task "${card.title}" into clear steps for a language model to follow.\nTask: ${card.title}\nSubtitle: ${card.subtitle}\nSteps:`;
  messages.value.push({
    sender: 'user',
    content: prompt
  });
}

</script>

<style scoped>
.q-card {
  border: 1px solid #555;
  border-radius: 8px;
  transition: transform 0.2s;
}

.q-card:hover {
  border: 1px solid #ccc;
}
</style>