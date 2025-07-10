<template>
  <div style='height: 100vh;'>
    <Header />
    <div style='height: calc(100vh - 48px);'>
      <Panels />
    </div>
  </div>
</template>
<script setup lang="ts">

import Header from './components/header/Header.vue'
import Panels from './components/panel/Panels.vue'

</script>
