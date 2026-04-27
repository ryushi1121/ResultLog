<template>
  <aside class="sidebar" :class="{ open }">
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: $route.path === item.to }"
        @click="handleNavClick"
        :id="'nav-' + item.id"
      >
        <i class="nav-icon" :class="item.icon"></i>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-version">v1.0.0</div>
    </div>
  </aside>

  <!-- モバイル用オーバーレイ -->
  <div
    v-if="open"
    class="sidebar-overlay"
    @click="$emit('close')"
  ></div>
</template>

<script>
export default {
  name: 'AppSidebar',
  props: {
    open: { type: Boolean, default: false }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const navItems = [
      { to: '/', label: 'ダッシュボード', icon: 'fa-solid fa-chart-pie', id: 'dashboard' },
      { to: '/entry', label: '収支登録', icon: 'fa-solid fa-pen-to-square', id: 'entry' },
      { to: '/list', label: '収支一覧', icon: 'fa-solid fa-list', id: 'list' },
      { to: '/analytics', label: '集計', icon: 'fa-solid fa-table-list', id: 'analytics' },
      { to: '/charts', label: '分析', icon: 'fa-solid fa-chart-area', id: 'charts' },
      { to: '/settings', label: '設定', icon: 'fa-solid fa-gear', id: 'settings' }
    ]

    const handleNavClick = () => {
      if (window.innerWidth < 1024) {
        emit('close')
      }
    }

    return { navItems, handleNavClick }
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: rgba(15, 15, 26, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  transform: translateX(-100%);
  transition: transform var(--transition-base);
  overflow-y: auto;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.nav-item.active {
  color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.08);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent-primary);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 1.2rem;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.sidebar-version {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-align: center;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 1023px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: calc(var(--z-sidebar) - 1);
    animation: fadeIn var(--transition-fast) ease;
  }
}
</style>
