class CancelablePromise {
  constructor(executor) {
    if (!executor || typeof executor !== 'function') {
      throw new Error('Wrong constructor arguments')
    }
    this.isCanceled = false
    this.promise = new Promise((resolve, reject) => {
      this.cancel = () => {
        this.isCanceled = true
        if (this.prev && !this.prev.isCanceled) {
          this.prev.cancel()
        }
        for (let n of this.next) {
          n.cancel()
        }
        if (!this.prev) {
          reject({ isCanceled: true })
        }
      }
      executor(
        (value) => resolve(value),
        (reason) => reject(reason))
    })
    this.next = []
    this.prev = null
  }

  then(onFulfilled = (v) => v, onRejected) {
    if (typeof onFulfilled !== 'function') {
      throw new Error('Wrong arguments')
    }

    this.next.push(new CancelablePromise((resolve, reject) => {
      this.promise.then(
        (value) => {
          resolve(onFulfilled(value))
        }, 
        (reason) => {
          if (onRejected && typeof onRejected === 'function') {
            resolve(onRejected(reason))
          } else {
            reject(reason)
          }
        })
    }))

    this.next[this.next.length - 1].prev = this
    return this.next[this.next.length - 1]
  }

  catch(onRejected) {
    return this.then((v) => v, onRejected)
  }
}

module.exports = CancelablePromise