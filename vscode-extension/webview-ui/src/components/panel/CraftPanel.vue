<template>
  <div class="flex justify-center align-center flex-column full-height">
    <div class="text-h6 q-my-md text-center q-mt-lg" style="margin-top: 48px;">
      Create Reactive & Realtime dApps with Linera Microchain
    </div>

    <div class="row justify-center q-mt-md flex-1">
      <div class="full-width" v-for="(card, index) in cards" :key="index">
        <q-card flat class="q-pa-md cursor-pointer full-width bg-transparent row q-mt-sm items-center">
          <q-icon :name="card.icon" size="1.2rem" class="q-mr-md" />
          <div class="text-normal text-weight-medium q-mr-sm">{{ card.title }}</div>
          <div class="text-caption text-grey">{{ card.subtitle }}</div>
        </q-card>
      </div>
    </div>

    <div class="q-my-sm q-mx-md fixed-bottom q-pa-sm">
      <MessageInput />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import MessageInput from '../input/MessageInput.vue';

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
</script>

<style scoped>
.q-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  transition: transform 0.2s;
}

.q-card:hover {
  border: 1px solid #555;
}
</style>
