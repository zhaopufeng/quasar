---
title: Select
desc: The QSelect Vue component has two types of selection - single or multiple. This component opens up a menu for the selection list and action. A filter can also be used for longer lists.
---

The QSelect component has two types of selection: single or multiple. This component opens up a menu for the selection list and action. A filter can also be used for longer lists.

In case you are looking for a dropdown "button" instead of "input" use [Button Dropdown](/vue-components/button-dropdown) instead.

## Installation
<doc-installation components="QSelect"/>

## Design

### Overview

::: warning
For your QSelect you can use only one of the main designs (`filled`, `outlined`, `standout`, `borderless`). You cannot use multiple as they are self-exclusive.
:::

<doc-example title="Design Overview" file="QSelect/DesignOverview" />

### Decorators

<doc-example title="Decorators" file="QSelect/Decorators" />

### Coloring

<doc-example title="Coloring" file="QSelect/Coloring" />

### Clearable
As a helper, you can use `clearable` prop so user can reset model to `null` through an appended icon. The second QSelect in the example below is the equivalent of using `clearable`.

<doc-example title="Clearable" file="QSelect/Clearable" />

### Disable and readonly
<doc-example title="Disable and readonly" file="QSelect/DisableReadonly" />

### Menu transitions

::: warning
Please note that transitions do not work when using `options-cover` prop.
:::

In the example below there's a few transitions showcased. For a full list of transitions available, go to [Transitions](/options/transitions).

<doc-example title="Menu transitions" file="QSelect/MenuTransitions" />

### Options list display mode
By default QSelect shows the list of options as a menu on desktop and as a dialog on mobiles. You can force one behavior by using the `behavior` property.

::: warning
Please note that on iOS menu behavior might generate problems, especially when used in combination with `use-input` prop. You can use a conditional `behavior` prop like `:behavior="$q.platform.is.ios === true ? 'dialog' : 'menu'"` to use dialog mode only on iOS.
:::

<doc-example title="Show options in menu" file="QSelect/BehaviorMenu" />

<doc-example title="Show options in dialog" file="QSelect/BehaviorDialog" />

## The model

::: danger
The model for single selection can be anything (String, Object, ...) while the model for multiple selection must be an Array.
:::

<doc-example title="Single vs multiple selection" file="QSelect/ModelSingleMultiple" />

<doc-example title="Multiple selection, counter and max-values" file="QSelect/ModelMultipleCounter" />

The model content can be influenced by `emit-value` prop as you'll learn in "The options" section below.

## The options

### Options type

<doc-example title="String options" file="QSelect/OptionString" />

<doc-example title="Object options" file="QSelect/OptionObject" />

### Affecting model

When `emit-value` is used, the model becomes the determined `value` from the specified selected option. Default is to emit the whole option. It makes sense to use it only when the options are of Object form.

<doc-example title="Emit-value" file="QSelect/OptionEmitValue" />

When `map-options` is used, the model can contain only the `value`, and it will be mapped against the options to determine its label. There is a performance penalty involved, so use it only if absolutely necessary. It's not needed, for example, if the model contains the whole Object (so contains the label prop).

<doc-example title="Map options" file="QSelect/OptionMapOptions" />

### Custom prop names

By default, QSelect looks at `label`, `value`, `disable` and `sanitize` props of each option from the options array Objects. But you can override those:

::: warning
If you use functions for custom props always check if the option is null. These functions are used both for options in the list and for the selected options.
:::

<doc-example title="Custom label, value and disable props" file="QSelect/OptionCustomProps" />

### Customizing menu options

<doc-example title="Options slot" file="QSelect/OptionSlot" />

By default, when there are no options, the menu won't appear. But you can customize this scenario and specify what the menu should display.

<doc-example title="No options slot" file="QSelect/OptionNoneSlot" />

### Lazy loading

The following example shows a glimpse of how you can play with lazy loading the options. This means, along with many other things, that `options` prop is not required on first render.

<doc-example title="Lazy load options" file="QSelect/OptionLazyLoad" />

### Cover mode

<doc-example title="Menu covering component" file="QSelect/OptionCover" />

## The display value

<doc-example title="Custom display value" file="QSelect/DisplayCustomValue" />

<doc-example title="Chips as display value" file="QSelect/DisplayChips" />

<doc-example title="Selected-item slot" file="QSelect/DisplaySelectedItemSlot" />

## Filtering and autocomplete

### Native attributes with `use-input`

All the attributes set on `QSelect` that are not in the list of `props` in the **API** will be passed to the native `input` field used (please check `use-input` prop description first to understand what it does) for filtering / autocomplete / adding new value. Some examples: autocomplete, placeholder.

More information about [native input attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).

<doc-example title="Filtering options" file="QSelect/InputFilter" />

<doc-example title="Basic autocomplete" file="QSelect/InputAutocomplete" />

<doc-example title="Autocomplete on more than 2 chars" file="QSelect/InputFilterMin" />

<doc-example title="Lazy autocomplete" file="QSelect/InputFilterLazy" />

## Create new values

::: tip
The following are just a few examples to get you started into making your own QSelect behavior. This is not exhaustive list of possibilities that QSelect offers.

It makes sense to use this feature along with `use-input` prop.
:::

In order to enable the creation of new values, you need to **either specify** the `new-value-mode` prop **and/or** listen for `@new-value` event. If you use both, then the purpose of listening to `@new-value` would be only to override the `new-value-mode` in your custom scenarios.

### The new-value-mode prop
The `new-value-mode` prop value specifies how the value should be added: `add` (adds a value, even if duplicate), `add-unique` (add only if NOT duplicate) or `toggle` (adds value if it's not already in model, otherwise it removes it).

By using this prop you don't need to also listen for `@new-value` event, unless you have some specific scenarios for which you want to override the behavior.

<doc-example title="New value mode" file="QSelect/CreateNewValueMode" />

### The @new-value event
The `@new-value` event is emitted with the value to be added and a `done` callback. The `done` callback has two **optional** parameters:
  - the value to be added
  - the behavior (same values of `new-value-mode` prop, and when it is specified it overrides that prop -- if it is used) -- default behavior (if not using `new-value-mode`) is to add the value even if it would be a duplicate

Calling `done()` with no parameters simply empties the input box value, without tampering with the model in any way.

<doc-example title="Listening on @new-value" file="QSelect/CreateListener" />

<doc-example title="Adding only unique values" file="QSelect/CreateListenerUnique" />

### Using menu and filtering
Filtering and adding the new values to menu:

<doc-example title="Filtering and adding to menu" file="QSelect/FilteringAddsToMenu" />

Filters new values (in the example below the value to be added requires at least 3 characters to pass), and does not add to menu:

<doc-example title="Filtering without adding to menu" file="QSelect/FilteringNoAddToMenu" />

## Sanitization

::: warning
Always sanitize values if you do not trust the origin (if the value comes from user input).
:::

You can force sanitization of the menu options by:
  - setting `sanitize` key of the untrusted option to `true` (for specific untrusted options)
  - or by setting `options-sanitize` prop of QSelect (for all options)

::: warning
If you use `option` slot, then you are responsible for sanitization of the menu options. The `options-sanitize` prop will not apply.
:::

The displayed value of QSelect is sanitized if:
  - the `display-value-sanitize` prop of QSelect is set
  - or you are not using `display-value` and
    - the `options-sanitize` prop of QSelect is set
    - any selected option has `sanitize` key set to `true`

::: warning
If you use `selected` or `selected-item` slots, then you are responsible for sanitization of the display value. The `display-value-sanitize` prop will not apply.
:::

<doc-example title="Sanitize options" file="QSelect/SanitizeOptions" />

<doc-example title="Sanitize display value" file="QSelect/SanitizeDisplayCustomValue" />

## Render performance

The render performance is NOT affected much by the number of options, unless `map-options` is used on a large set.
Notice the infinite scroll in place which renders additional options as the user scrolls through the list.

<doc-example title="10k options" file="QSelect/Render10k" />

## QSelect API
<doc-api file="QSelect" />
