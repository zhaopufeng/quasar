import Vue from 'vue'

import QField from '../field/QField.js'
import QIcon from '../icon/QIcon.js'
import QChip from '../chip/QChip.js'

import QItem from '../list/QItem.js'
import QItemSection from '../list/QItemSection.js'
import QItemLabel from '../list/QItemLabel.js'

import QMenu from '../menu/QMenu.js'
import QDialog from '../dialog/QDialog.js'

import { isDeepEqual } from '../../utils/is.js'
import { stop, prevent, stopAndPrevent } from '../../utils/event.js'
import { normalizeToInterval } from '../../utils/format.js'

import VirtualList from '../../mixins/virtual-list.js'

const validateNewValueMode = v => ['add', 'add-unique', 'toggle'].includes(v)

export default Vue.extend({
  name: 'QSelect',

  mixins: [ QField, VirtualList ],

  props: {
    value: {
      required: true
    },

    multiple: Boolean,

    displayValue: [String, Number],
    displayValueSanitize: Boolean,
    dropdownIcon: String,

    options: {
      type: Array,
      default: () => []
    },

    optionValue: [Function, String],
    optionLabel: [Function, String],
    optionDisable: [Function, String],

    hideSelected: Boolean,
    hideDropdownIcon: Boolean,
    fillInput: Boolean,

    maxValues: [Number, String],

    optionsDense: Boolean,
    optionsDark: Boolean,
    optionsSelectedClass: String,
    optionsCover: Boolean,
    optionsSanitize: Boolean,

    popupContentClass: String,
    popupContentStyle: [String, Array, Object],

    useInput: Boolean,
    useChips: Boolean,

    newValueMode: {
      type: String,
      validator: validateNewValueMode
    },

    mapOptions: Boolean,
    emitValue: Boolean,

    inputDebounce: {
      type: [Number, String],
      default: 500
    },

    transitionShow: String,
    transitionHide: String,

    behavior: {
      type: String,
      validator: v => ['default', 'menu', 'dialog'].includes(v),
      default: 'default'
    }
  },

  data () {
    return {
      menu: false,
      dialog: false,
      optionIndex: -1,
      inputValue: ''
    }
  },

  watch: {
    innerValue: {
      handler () {
        if (
          this.useInput === true &&
          this.fillInput === true &&
          this.multiple !== true &&
          // Prevent re-entering in filter while filtering
          // Also prevent clearing inputValue while filtering
          this.innerLoading !== true &&
          ((this.dialog !== true && this.menu !== true) || this.hasValue !== true)
        ) {
          this.__resetInputValue()
          if (this.dialog === true || this.menu === true) {
            this.filter('')
          }
        }
      },
      immediate: true
    },

    menu (show) {
      this.__updateMenu(show)
    }
  },

  computed: {
    virtualListLength () {
      return Array.isArray(this.options)
        ? this.options.length
        : 0
    },

    fieldClass () {
      return `q-select q-field--auto-height q-select--with${this.useInput !== true ? 'out' : ''}-input`
    },

    menuContentClass () {
      return (this.virtualListHorizontal === true ? 'q-virtual-list--horizontal' : '') +
        (this.popupContentClass ? ' ' + this.popupContentClass : '')
    },

    menuClass () {
      return this.menuContentClass + (this.optionsDark === true ? ' q-select__menu--dark' : '')
    },

    innerValue () {
      const
        mapNull = this.mapOptions === true && this.multiple !== true,
        val = this.value !== void 0 && (this.value !== null || mapNull === true)
          ? (this.multiple === true && Array.isArray(this.value) ? this.value : [ this.value ])
          : []

      return this.mapOptions === true && Array.isArray(this.options) === true
        ? (
          this.value === null && mapNull === true
            ? val.map(v => this.__getOption(v)).filter(v => v !== null)
            : val.map(v => this.__getOption(v))
        )
        : val
    },

    noOptions () {
      return this.virtualListLength.length === 0
    },

    selectedString () {
      return this.innerValue
        .map(opt => this.__getOptionLabel(opt))
        .join(', ')
    },

    displayAsText () {
      return this.displayValueSanitize === true || (
        this.displayValue === void 0 && (
          this.optionsSanitize === true ||
          this.innerValue.some(opt => opt !== null && opt.sanitize === true)
        )
      )
    },

    selectedScope () {
      const tabindex = this.focused === true ? 0 : -1

      return this.innerValue.map((opt, i) => ({
        index: i,
        opt,
        sanitize: this.optionsSanitize === true || opt.sanitize === true,
        selected: true,
        removeAtIndex: this.__removeAtIndexAndFocus,
        toggleOption: this.toggleOption,
        tabindex
      }))
    },

    optionScope () {
      if (this.virtualListLength === 0) {
        return []
      }

      const { from, to } = this.virtualListSliceRange

      return this.options.slice(from, to).map((opt, i) => {
        const disable = this.__isDisabled(opt)
        const index = from + i

        const itemProps = {
          clickable: true,
          active: false,
          activeClass: this.optionsSelectedClass,
          manualFocus: true,
          focused: false,
          disable,
          tabindex: -1,
          dense: this.optionsDense,
          dark: this.optionsDark
        }

        if (disable !== true) {
          this.__isSelected(opt) === true && (itemProps.active = true)
          this.optionIndex === index && (itemProps.focused = true)
        }

        const itemEvents = {
          click: () => { this.toggleOption(opt) }
        }

        if (this.$q.platform.is.desktop === true) {
          itemEvents.mousemove = () => { this.setOptionIndex(index) }
        }

        return {
          index,
          opt,
          sanitize: this.optionsSanitize === true || opt.sanitize === true,
          selected: itemProps.active,
          focused: itemProps.focused,
          toggleOption: this.toggleOption,
          setOptionIndex: this.setOptionIndex,
          itemProps,
          itemEvents
        }
      })
    },

    dropdownArrowIcon () {
      return this.dropdownIcon !== void 0
        ? this.dropdownIcon
        : this.$q.iconSet.arrow.dropdown
    },

    squaredMenu () {
      return this.optionsCover === false &&
        this.outlined !== true &&
        this.standout !== true &&
        this.borderless !== true &&
        this.rounded !== true
    }
  },

  methods: {
    removeAtIndex (index) {
      if (index > -1 && index < this.innerValue.length) {
        if (this.multiple === true) {
          const model = [].concat(this.value)
          this.$emit('remove', { index, value: model.splice(index, 1) })
          this.$emit('input', model)
        }
        else {
          this.$emit('input', null)
        }
      }
    },

    __removeAtIndexAndFocus (index) {
      this.removeAtIndex(index)
      this.__focus()
    },

    add (opt, unique) {
      const val = this.emitValue === true
        ? this.__getOptionValue(opt)
        : opt

      if (this.multiple !== true) {
        this.$emit('input', val)
        return
      }

      if (this.innerValue.length === 0) {
        this.$emit('add', { index: 0, value: val })
        this.$emit('input', this.multiple === true ? [ val ] : val)
        return
      }

      if (unique === true && this.__isSelected(opt) === true) {
        return
      }

      const model = [].concat(this.value)

      if (this.maxValues !== void 0 && model.length >= this.maxValues) {
        return
      }

      this.$emit('add', { index: model.length, value: val })
      model.push(val)
      this.$emit('input', model)
    },

    toggleOption (opt) {
      if (this.editable !== true || opt === void 0 || this.__isDisabled(opt) === true) {
        return
      }

      const optValue = this.__getOptionValue(opt)

      if (this.multiple !== true) {
        this.updateInputValue(
          this.fillInput === true ? this.__getOptionLabel(opt) : '',
          true
        )

        this.hidePopup()

        if (isDeepEqual(this.__getOptionValue(this.value), optValue) !== true) {
          this.$emit('input', this.emitValue === true ? optValue : opt)
        }
        return
      }

      this.__focus()

      if (this.innerValue.length === 0) {
        const val = this.emitValue === true ? optValue : opt
        this.$emit('add', { index: 0, value: val })
        this.$emit('input', this.multiple === true ? [ val ] : val)
        return
      }

      const
        model = [].concat(this.value),
        index = this.value.findIndex(v => isDeepEqual(this.__getOptionValue(v), optValue))

      if (index > -1) {
        this.$emit('remove', { index, value: model.splice(index, 1) })
      }
      else {
        if (this.maxValues !== void 0 && model.length >= this.maxValues) {
          return
        }

        const val = this.emitValue === true ? optValue : opt

        this.$emit('add', { index: model.length, value: val })
        model.push(val)
      }

      this.$emit('input', model)
    },

    setOptionIndex (index) {
      if (this.$q.platform.is.desktop !== true) { return }

      const val = index > -1 && index < this.virtualListLength
        ? index
        : -1

      if (this.optionIndex !== val) {
        this.optionIndex = val
      }
    },

    __getOption (value) {
      return this.options.find(opt => isDeepEqual(this.__getOptionValue(opt), value)) || value
    },

    __getOptionValue (opt) {
      if (typeof this.optionValue === 'function') {
        return this.optionValue(opt)
      }
      if (Object(opt) === opt) {
        return typeof this.optionValue === 'string'
          ? opt[this.optionValue]
          : opt.value
      }
      return opt
    },

    __getOptionLabel (opt) {
      if (typeof this.optionLabel === 'function') {
        return this.optionLabel(opt)
      }
      if (Object(opt) === opt) {
        return typeof this.optionLabel === 'string'
          ? opt[this.optionLabel]
          : opt.label
      }
      return opt
    },

    __isDisabled (opt) {
      if (typeof this.optionDisable === 'function') {
        return this.optionDisable(opt) === true
      }
      if (Object(opt) === opt) {
        return typeof this.optionDisable === 'string'
          ? opt[this.optionDisable] === true
          : opt.disable === true
      }
      return false
    },

    __isSelected (opt) {
      const val = this.__getOptionValue(opt)
      return this.innerValue
        .find(v => isDeepEqual(this.__getOptionValue(v), val)) !== void 0
    },

    __onTargetKeydown (e) {
      // escape, tab
      if (e.keyCode === 27 || e.keyCode === 9) {
        this.__closeMenu()
        return
      }

      if (e.target !== this.$refs.target) { return }

      // down
      if (
        e.keyCode === 40 &&
        this.innerLoading !== true &&
        this.menu === false
      ) {
        stopAndPrevent(e)
        this.showPopup()
        return
      }

      // delete
      if (
        e.keyCode === 8 &&
        this.multiple === true &&
        this.inputValue.length === 0 &&
        Array.isArray(this.value)
      ) {
        this.removeAtIndex(this.value.length - 1)
        return
      }

      // up, down
      const optionsLength = this.virtualListLength

      if (e.keyCode === 38 || e.keyCode === 40) {
        stopAndPrevent(e)

        if (this.menu === true) {
          let index = this.optionIndex
          do {
            index = normalizeToInterval(
              index + (e.keyCode === 38 ? -1 : 1),
              -1,
              optionsLength - 1
            )
          }
          while (index !== -1 && index !== this.optionIndex && this.__isDisabled(this.options[index]) === true)

          if (this.optionIndex !== index) {
            this.setOptionIndex(index)
            this.scrollTo(index, e.keyCode === 40) // align down

            if (index >= 0 && this.useInput === true && this.fillInput === true) {
              const inputValue = this.__getOptionLabel(this.options[index])
              if (this.inputValue !== inputValue) {
                this.inputValue = inputValue
              }
            }
          }
        }
      }

      // enter
      if (e.target !== this.$refs.target || e.keyCode !== 13) { return }

      stopAndPrevent(e)

      if (this.optionIndex > -1 && this.optionIndex < optionsLength) {
        this.toggleOption(this.options[this.optionIndex])
        return
      }

      if (
        this.inputValue.length > 0 &&
        (this.newValueMode !== void 0 || this.$listeners['new-value'] !== void 0)
      ) {
        const done = (val, mode) => {
          if (mode) {
            if (validateNewValueMode(mode) !== true) {
              console.error('QSelect: invalid new value mode - ' + mode)
              return
            }
          }
          else {
            mode = this.newValueMode
          }

          if (val !== void 0 && val !== null) {
            this[mode === 'toggle' ? 'toggleOption' : 'add'](
              val,
              mode === 'add-unique'
            )
          }

          this.updateInputValue('', this.multiple !== true)
        }

        if (this.$listeners['new-value'] !== void 0) {
          this.$emit('new-value', this.inputValue, done)

          if (this.multiple !== true) {
            return
          }
        }
        else {
          done(this.inputValue)
        }
      }

      if (this.menu === true) {
        this.__closeMenu()
      }
      else if (this.innerLoading !== true) {
        this.showPopup()
      }
    },

    __getVirtualListEl () {
      return this.hasDialog === true
        ? this.$refs.menuContent
        : (
          this.$refs.menu !== void 0
            ? this.$refs.menu.__portal.$el
            : void 0
        )
    },

    __getVirtualListScrollTarget () {
      return this.__getVirtualListEl()
    },

    __getSelection (h, fromDialog) {
      if (this.hideSelected === true) {
        return fromDialog !== true && this.hasDialog === true
          ? [
            h('span', {
              domProps: {
                'textContent': this.inputValue
              }
            })
          ]
          : []
      }

      if (this.$scopedSlots['selected-item'] !== void 0) {
        return this.selectedScope.map(scope => this.$scopedSlots['selected-item'](scope))
      }

      if (this.$scopedSlots.selected !== void 0) {
        return this.$scopedSlots.selected()
      }

      if (this.useChips === true) {
        const tabindex = this.focused === true ? 0 : -1

        return this.selectedScope.map((scope, i) => h(QChip, {
          key: 'option-' + i,
          props: {
            removable: this.__isDisabled(scope.opt) !== true,
            dense: true,
            textColor: this.color,
            tabindex
          },
          on: {
            remove () { scope.removeAtIndex(i) }
          }
        }, [
          h('span', {
            domProps: {
              [scope.sanitize === true ? 'textContent' : 'innerHTML']: this.__getOptionLabel(scope.opt)
            }
          })
        ]))
      }

      return [
        h('span', {
          domProps: {
            [this.displayAsText ? 'textContent' : 'innerHTML']: this.displayValue !== void 0
              ? this.displayValue
              : this.selectedString
          }
        })
      ]
    },

    __getControl (h, fromDialog) {
      let data = { attrs: {} }
      const child = this.__getSelection(h, fromDialog)

      if (this.useInput === true && (fromDialog === true || this.hasDialog === false)) {
        child.push(this.__getInput(h))
      }
      else if (this.editable === true) {
        data = {
          ref: 'target',
          attrs: {
            tabindex: 0,
            autofocus: this.autofocus
          },
          on: {
            keydown: this.__onTargetKeydown
          }
        }
      }

      Object.assign(data.attrs, this.$attrs)
      data.staticClass = 'q-field__native row items-center'

      return h('div', data, child)
    },

    __getOptions (h) {
      if (this.menu !== true) {
        return void 0
      }

      const fn = this.$scopedSlots.option !== void 0
        ? this.$scopedSlots.option
        : scope => h(QItem, {
          key: scope.index,
          props: scope.itemProps,
          on: scope.itemEvents
        }, [
          h(QItemSection, [
            h(QItemLabel, {
              domProps: {
                [scope.sanitize === true ? 'textContent' : 'innerHTML']: this.__getOptionLabel(scope.opt)
              }
            })
          ])
        ])

      return this.__padVirtualList(h, this.optionScope.map(fn))
    },

    __getInnerAppend (h) {
      return this.loading !== true && this.innerLoading !== true && this.hideDropdownIcon !== true
        ? [
          h(QIcon, {
            staticClass: 'q-select__dropdown-icon',
            props: { name: this.dropdownArrowIcon }
          })
        ]
        : null
    },

    __onCompositionStart (e) {
      e.target.composing = true
    },

    __onCompositionUpdate (e) {
      if (typeof e.data === 'string' && e.data.codePointAt(0) < 256) {
        e.target.composing = false
      }
    },

    __onCompositionEnd (e) {
      if (e.target.composing !== true) { return }
      e.target.composing = false

      this.__onInputValue(e)
    },

    __getInput (h) {
      const on = {
        input: this.__onInputValue,
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        change: this.__onCompositionEnd,
        compositionstart: this.__onCompositionStart,
        compositionend: this.__onCompositionEnd,
        keydown: this.__onTargetKeydown
      }

      if (this.$q.platform.is.android === true) {
        on.compositionupdate = this.__onCompositionUpdate
      }

      if (this.hasDialog === true) {
        on.click = stop
      }

      return h('input', {
        ref: 'target',
        staticClass: 'q-select__input q-placeholder col',
        class: this.hideSelected !== true && this.innerValue.length > 0
          ? 'q-select__input--padding'
          : null,
        domProps: { value: this.inputValue },
        attrs: {
          // required for Android in order to show ENTER key when in form
          type: 'search',
          tabindex: 0,
          autofocus: this.autofocus,
          ...this.$attrs,
          id: this.targetUid,
          disabled: this.disable === true,
          readonly: this.readonly === true
        },
        on
      })
    },

    __onInputValue (e) {
      clearTimeout(this.inputTimer)

      if (e && e.target && e.target.composing === true) {
        return
      }

      this.inputValue = e.target.value || ''

      if (this.$listeners.filter !== void 0) {
        this.inputTimer = setTimeout(() => {
          this.filter(this.inputValue, true)
        }, this.inputDebounce)
      }
    },

    updateInputValue (val, noFiltering) {
      if (this.useInput === true) {
        if (this.inputValue !== val) {
          this.inputValue = val
        }

        noFiltering !== true && this.filter(val)
      }
    },

    filter (val, userInput) {
      if (this.$listeners.filter === void 0 || this.focused !== true) {
        return
      }

      if (this.innerLoading === true) {
        this.$emit('filter-abort')
      }
      else {
        this.innerLoading = true
      }

      if (
        val !== '' &&
        this.multiple !== true &&
        this.innerValue.length > 0 &&
        userInput !== true &&
        val === this.__getOptionLabel(this.innerValue[0])
      ) {
        val = ''
      }

      const filterId = setTimeout(() => {
        this.menu === true && (this.menu = false)
      }, 10)
      clearTimeout(this.filterId)
      this.filterId = filterId

      this.$emit(
        'filter',
        val,
        fn => {
          if (this.focused === true && this.filterId === filterId) {
            clearTimeout(this.filterId)
            typeof fn === 'function' && fn()
            this.$nextTick(() => {
              this.innerLoading = false
              if (this.menu === true) {
                this.__updateMenu(true)
              }
              else {
                this.menu = true
              }
            })
          }
        },
        () => {
          if (this.focused === true && this.filterId === filterId) {
            clearTimeout(this.filterId)
            this.innerLoading = false
          }
          this.menu === true && (this.menu = false)
        }
      )
    },

    __getControlEvents () {
      const focusout = e => {
        this.__onControlFocusout(e, () => {
          this.__resetInputValue()
          this.__closeMenu()
        })
      }

      return {
        focusin: this.__onControlFocusin,
        focusout,
        'popup-show': this.__onControlPopupShow,
        'popup-hide': e => {
          this.hasPopupOpen = false
          focusout(e)
        },
        click: e => {
          // label from QField will propagate click on the input (except IE)
          if (
            this.hasDialog !== true &&
            this.useInput === true &&
            e.target.classList.contains('q-select__input') !== true
          ) {
            return
          }
          if (this.hasDialog !== true && this.menu === true) {
            this.__closeMenu()
          }
          else {
            this.showPopup(e)
          }
        }
      }
    },

    __getPopup (h) {
      if (
        this.editable !== false && (
          this.dialog === true || // dialog always has menu displayed, so need to render it
          this.noOptions !== true ||
          this.$scopedSlots['no-option'] !== void 0
        )
      ) {
        return this[`__get${this.hasDialog === true ? 'Dialog' : 'Menu'}`](h)
      }
    },

    __getMenu (h) {
      const child = this.noOptions === true
        ? (
          this.$scopedSlots['no-option'] !== void 0
            ? this.$scopedSlots['no-option']({ inputValue: this.inputValue })
            : null
        )
        : this.__getOptions(h)

      return h(QMenu, {
        ref: 'menu',
        props: {
          value: this.menu,
          fit: true,
          cover: this.optionsCover === true && this.noOptions !== true && this.useInput !== true,
          contentClass: this.menuClass,
          contentStyle: this.popupContentStyle,
          noParentEvent: true,
          noRefocus: true,
          noFocus: true,
          square: this.squaredMenu,
          transitionShow: this.transitionShow,
          transitionHide: this.transitionHide
        },
        on: {
          '&scroll': this.__onVirtualListScroll,
          'before-hide': this.__closeMenu
        }
      }, child)
    },

    __getDialog (h) {
      const content = [
        h(QField, {
          staticClass: `col-auto ${this.fieldClass}`,
          props: {
            ...this.$props,
            dark: this.optionsDark,
            square: true,
            loading: this.innerLoading,
            filled: true,
            stackLabel: this.inputValue.length > 0
          },
          on: {
            ...this.$listeners,
            focus: stop,
            blur: stop
          },
          scopedSlots: {
            ...this.$scopedSlots,
            rawControl: () => this.__getControl(h, true),
            before: void 0,
            after: void 0
          }
        })
      ]

      this.menu === true && content.push(
        h('div', {
          ref: 'menuContent',
          staticClass: 'scroll',
          class: this.menuContentClass,
          style: this.popupContentStyle,
          on: {
            click: prevent,
            '&scroll': this.__onVirtualListScroll
          }
        }, (
          this.noOptions === true
            ? (
              this.$scopedSlots['no-option'] !== void 0
                ? this.$scopedSlots['no-option']({ inputValue: this.inputValue })
                : null
            )
            : this.__getOptions(h)
        ))
      )

      return h(QDialog, {
        props: {
          value: this.dialog,
          noRefocus: true,
          noFocus: true,
          position: this.useInput === true ? 'top' : void 0,
          transitionShow: this.transitionShow,
          transitionHide: this.transitionHide
        },
        on: {
          'before-hide': () => {
            this.focused = false
          },
          hide: e => {
            this.hidePopup()
            this.$emit('blur', e)
            this.__resetInputValue()
          },
          show: () => {
            document.activeElement.id !== this.targetUid && this.$refs.target !== document.activeElement && this.$refs.target.focus()
          }
        }
      }, [
        h('div', {
          staticClass: 'q-select__dialog' + (this.optionsDark === true ? ' q-select__menu--dark' : '')
        }, content)
      ])
    },

    __closeMenu () {
      if (this.dialog === true) {
        return
      }

      this.menu = false

      if (this.focused === false) {
        clearTimeout(this.filterId)
        this.filterId = void 0

        if (this.innerLoading === true) {
          this.$emit('filter-abort')
          this.innerLoading = false
        }
      }
    },

    showPopup (e) {
      if (this.hasDialog === true) {
        this.__onControlFocusin(e)
        this.dialog = true
      }
      else {
        this.__focus()
      }

      if (this.$listeners.filter !== void 0) {
        this.filter(this.inputValue)
      }
      else if (this.noOptions !== true || this.$scopedSlots['no-option'] !== void 0) {
        this.menu = true
      }
    },

    hidePopup () {
      this.dialog = false
      this.__closeMenu()
    },

    __resetInputValue () {
      this.useInput === true && this.updateInputValue(
        this.multiple !== true && this.fillInput === true && this.innerValue.length > 0
          ? this.__getOptionLabel(this.innerValue[0]) || ''
          : '',
        true
      )
    },

    __updateMenu (show) {
      let optionIndex = -1

      if (show === true) {
        if (this.innerValue.length > 0) {
          const val = this.__getOptionValue(this.innerValue[0])
          optionIndex = this.options.findIndex(v => isDeepEqual(this.__getOptionValue(v), val))
        }

        this.__resetVirtualList(optionIndex)
      }

      this.setOptionIndex(optionIndex)
    },

    __onPreRender () {
      this.hasDialog = this.$q.platform.is.mobile !== true && this.behavior !== 'dialog'
        ? false
        : this.behavior !== 'menu' && (
          this.useInput === true
            ? this.$scopedSlots['no-option'] !== void 0 || this.$listeners.filter !== void 0 || this.noOptions === false
            : true
        )
    },

    __onPostRender () {
      if (this.dialog === false && this.$refs.menu !== void 0) {
        this.$refs.menu.updatePosition()
      }
    },

    updateMenuPosition () {
      this.__onPostRender()
    }
  },

  beforeDestroy () {
    clearTimeout(this.inputTimer)
  }
})
