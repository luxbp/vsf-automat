<template>
  <div id="automat-conversation"></div>
</template>

<script>
export default {
  name: 'AutomatConverstation',
  mounted () {
    if (window.Smile) {
      window.Smile.ready().then(smileInstance => {
        document.getElementById('smile-ui-container').style['display'] = 'none'
      })
    }
  },
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>
