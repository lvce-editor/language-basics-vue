<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRouter } from '@front/util/router'
import { usePlugins } from '.'

export default defineComponent({
  props: {
    pluginId: {
      type: String,
      required: true,
    },
  },

  setup (props) {
    const {
      plugins,
    } = usePlugins()

    const plugin = computed(() => plugins.value.find(p => p.id === props.pluginId))

    const router = useRouter()
    function go () {
      router.push({
        name: 'plugin-details',
        params: {
          pluginId: props.pluginId,
        },
      })
    }

    return {
      plugin,
      go,
    }
  },
})
</script>

<template>
  <div
    v-if="plugin"
    class="flex space-x-3 items-center"
  >
    <div class="flex items-center justify-center w-8 h-8 bg-gray-700 dark:bg-gray-200 rounded">
      <img
        v-if="plugin.logo"
        :src="plugin.logo"
        alt="Plugin logo"
        class="max-w-[24px] max-h-[24px]"
      >
      <VueIcon
        v-else
        icon="extension"
      />
    </div>
    <div>
      <div>Provided by <b>{{ plugin ? plugin.label : pluginId }}</b></div>
      <div
        v-if="plugin"
        class="opacity-50"
      >
        <div>Plugin ID: {{ plugin.id }}</div>
      </div>
    </div>
  </div>
</template>
