import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  // ビルド成果物とPWA生成物は対象外
  { ignores: ['dist/**', 'dev-dist/**', '.firebase/**'] },

  // バグ検出寄りの essential のみ採用。
  // recommended は属性の並び順など整形ルールまで含み、既存コードの実害のない指摘が大量に出るため
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly'  // vite.config.js の define で注入
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
      'no-undef': 'error',
      'no-case-declarations': 'error'
    }
  },

  // テストと設定ファイルは Node 環境
  {
    files: ['**/*.test.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } }
  }
]
