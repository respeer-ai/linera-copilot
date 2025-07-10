<template>
  <q-layout view="hHh lpR fFf">
    <Header />

    <q-page-container>
      <q-page>
        <Panels />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">

import Header from './components/header/Header.vue'
import Panels from './components/panel/Panels.vue'

</script>
