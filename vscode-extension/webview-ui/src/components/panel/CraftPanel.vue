<template>
  <q-page class="flex flex-center column">
    <div class="text-h4 text-weight-bold q-my-md text-center">
      Create Reactive & Realtime dApps with Linera Microchain
    </div>

    <div class="row q-col-gutter-md justify-center q-mt-md flex-1">
      <div class="col-12 col-sm-6 col-md-3" v-for="(card, index) in cards" :key="index">
        <q-card flat class="q-pa-md text-center">
          <q-icon :name="card.icon" size="4rem" class="q-mb-md" />
          <div class="text-h6 text-weight-medium q-mb-sm">{{ card.title }}</div>
          <div class="text-caption text-grey">{{ card.subtitle }}</div>
        </q-card>
      </div>
    </div>

    <MessageInput class="fixed-bottom" />
  </q-page>
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
