<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <Header />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding>
        <p>Hello from Quasar!</p>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">

import Header from './components/header/Header.vue'

</script>
