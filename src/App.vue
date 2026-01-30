<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoginDialog from '@/components/LoginDialog.vue'
</script>

<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-notification-provider placement="top-left">
        <RouterView />
        
        <!-- 全局登录对话框 -->
        <LoginDialog />
      </n-notification-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>

<style scoped>
</style>
