
<script setup lang="ts">
 import { RouterView } from 'vue-router'
</script>

<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-notification-provider placement="top-left">
        <RouterView />
      </n-notification-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>

<style scoped>

</style>
