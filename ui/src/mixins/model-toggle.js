import History from '../history.js'

export default {
  props: {
    value: {
      type: Boolean,
      default: null
    }
  },

  data () {
    return {
      showing: false
    }
  },

  watch: {
    value (val) {
      if (this.disable === true && val === true) {
        this.$emit('input', false)
        return
      }

      if (this.avoidModelWatcher === true) {
        this.avoidModelWatcher = false
        console.log('this.avoidModelWatcher -> true -> setting false')
      }
      else if (val !== this.showing) {
        console.log('val !== this.showing; calling', val ? 'show' : 'hide')
        this[val === true ? 'show' : 'hide']()
      }
    }
  },

  methods: {
    toggle (evt) {
      this[this.showing === true ? 'hide' : 'show'](evt)
    },

    show (evt) {
      if (this.disable === true || (this.showing === true && this.newState !== false)) {
        return
      }
      if (this.__showCondition !== void 0 && this.__showCondition(evt) !== true) {
        return
      }

      this.value !== true && this.$emit('input', true)

      this.__runModelToggle(true, () => {
        this.$emit('before-show', evt)

        if (this.$options.modelToggle !== void 0 && this.$options.modelToggle.history === true) {
          this.__historyEntry = {
            handler: this.hide
          }
          History.add(this.__historyEntry)
        }

        if (this.__show !== void 0) {
          this.__show(evt)
        }
        else {
          this.$emit('show', evt)
        }
      })
    },

    hide (evt) {
      if (this.disable === true || (this.showing === false && this.newState !== true)) {
        return
      }

      this.value !== false && this.$emit('input', false)

      this.__runModelToggle(false, () => {
        this.$emit('before-hide', evt)

        this.__removeHistory()

        if (this.__hide !== void 0) {
          this.__hide(evt)
        }
        else {
          this.$emit('hide', evt)
        }
      })
    },

    __removeHistory () {
      if (this.__historyEntry !== void 0) {
        History.remove(this.__historyEntry)
        this.__historyEntry = void 0
      }
    },

    __runModelToggle (newVal, fn) {
      this.avoidModelWatcher = true
      console.log('this.newState = ', newVal)
      this.newState = newVal

      if (this.value === null) {
        console.log('runModel -> direct', newVal)
        if (this.showing !== newVal) {
          console.log('run fn 1')
          this.showing = newVal
          fn()
        }
      }
      else {
        this.$nextTick(() => {
          this.avoidModelWatcher = false
          console.log('runModel -> nextTick', newVal, this.value, this.showing, this.newState)
          if (this.value === newVal && this.showing !== newVal && this.newState === newVal) {
            console.log('run fn 2')
            this.showing = newVal
            fn()
          }
        })
      }
    }
  },

  beforeDestroy () {
    this.showing === true && this.__removeHistory()
  }
}
