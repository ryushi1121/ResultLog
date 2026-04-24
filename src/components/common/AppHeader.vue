<template>
  <header class="header">
    <div class="header-left">
      <button class="btn-icon header-menu-btn" @click="$emit('toggle-sidebar')" id="sidebar-toggle">
        <span class="menu-icon" :class="{ open: sidebarOpen }">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      <router-link to="/" class="header-logo">
        <img src="/favicon.svg" alt="ResultLog" class="logo-img" />
        <span class="logo-text">ResultLog</span>
      </router-link>
    </div>

    <div class="header-right">
      <div v-if="user" class="user-info">
        <img
          v-if="user.picture"
          :src="user.picture"
          :alt="user.name"
          class="user-avatar"
        />
        <span class="user-name">{{ user.name }}</span>
        <button class="btn btn-ghost btn-sm" @click="$emit('logout')" id="logout-btn">
          ログアウト
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
    user: { type: Object, default: null },
    sidebarOpen: { type: Boolean, default: false }
  },
  emits: ['toggle-sidebar', 'logout']
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: rgba(10, 10, 20, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  z-index: var(--z-header);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-fast);
}

.header-menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.menu-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 20px;
}

.menu-icon span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--text-primary);
  border-radius: 1px;
  transition: all var(--transition-base);
}

.menu-icon.open span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
}

.menu-icon.open span:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  text-decoration: none;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.logo-img {
  width: 24px;
  height: 24px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--glass-border);
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
