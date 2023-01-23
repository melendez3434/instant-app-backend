// import { dep } from 'optimism'
// import { Slot } from '@wry/context'
// import { useState, useEffect } from 'react'
// export var cacheSlot = new Slot()
// var cacheInfoMap = new WeakMap()
// function getCacheInfo(cache) {
//   var info = cacheInfoMap.get(cache)
//   if (!info) {
//     cacheInfoMap.set(
//       cache,
//       (info = {
//         vars: new Set(),
//         dep: dep(),
//       }),
//     )
//   }
//   return info
// }
// export function forgetCache(cache) {
//   getCacheInfo(cache).vars.forEach(function (rv) {
//     return rv.forgetCache(cache)
//   })
// }
// export function recallCache(cache) {
//   getCacheInfo(cache).vars.forEach(function (rv) {
//     return rv.attachCache(cache)
//   })
// }
// export function makeVar(value) {
//   var caches = new Set()
//   var listeners = new Set()
//   var rv = function (newValue) {
//     if (arguments.length > 0) {
//       if (value !== newValue) {
//         value = newValue
//         caches.forEach(function (cache) {
//           getCacheInfo(cache).dep.dirty(rv)
//           broadcast(cache)
//         })
//         var oldListeners = Array.from(listeners)
//         listeners.clear()
//         oldListeners.forEach(function (listener) {
//           return listener(value)
//         })
//       }
//     } else {
//       var cache = cacheSlot.getValue()
//       if (cache) {
//         attach(cache)
//         getCacheInfo(cache).dep(rv)
//       }
//     }
//     return value
//   }
//   rv.onNextChange = function (listener) {
//     listeners.add(listener)
//     return function () {
//       listeners.delete(listener)
//     }
//   }
//   var attach = (rv.attachCache = function (cache) {
//     caches.add(cache)
//     getCacheInfo(cache).vars.add(rv)
//     return rv
//   })
//   rv.forgetCache = function (cache) {
//     return caches.delete(cache)
//   }
//   return rv
// }
// function broadcast(cache) {
//   if (cache.broadcastWatches) {
//     cache.broadcastWatches()
//   }
// }
// //# sourceMappingURL=reactiveVars.js.map

// export function useReactiveVar<T>(rv): T {
//   const value = rv()

//   // We don't actually care what useState thinks the value of the variable
//   // is, so we take only the update function from the returned array.
//   const setValue = useState(value)[1]

//   // We subscribe to variable updates on initial mount and when the value has
//   // changed. This avoids a subtle bug in React.StrictMode where multiple
//   // listeners are added, leading to inconsistent updates.
//   useEffect(() => {
//     const probablySameValue = rv()
//     if (value !== probablySameValue) {
//       // If the value of rv has already changed, we don't need to listen for the
//       // next change, because we can report this change immediately.
//       setValue(probablySameValue)
//     } else {
//       return rv.onNextChange(setValue)
//     }
//   }, [value])

//   return value
// }
