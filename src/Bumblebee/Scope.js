'use strict'

const TransformerAbstract = require('./TransformerAbstract')
const Resources = require('./Resources')

/**
 * Bumblebee class
 *
 * @namespace Adonis/Addons/Bumblebee
 * @singleton
 * @alias Bumblebee
 *
 * @class Bumblebee
 * @constructor
 */
class Scope {
  constructor (manager, resource, ctx, scopeIdentifier = null) {
    this._manager = manager
    this._resource = resource
    this._ctx = ctx
    this._scopeIdentifier = scopeIdentifier
    this._parentScopes = []
  }

  async toArray () {
    if (this._resource instanceof Resources.Collection) {
      return this._collection(this._resource.getData(), this._resource.getTransformer())
    }

    if (this._resource instanceof Resources.Item) {
      return this._item(this._resource.getData(), this._resource.getTransformer())
    }

    return this._resource.getData()
  }

  async _collection (data, transformer) {
    return Promise.all(
      this._getCollectionRows(await data).map((item) => this._item(item, transformer))
    )
  }

  async _item (data, transformer) {
    let transformerInstance = this._getTransformerInstance(transformer)

    let transformed = await transformerInstance.transform(await data, this._ctx)

    let includeData = await transformerInstance.processIncludedResources(this, await data)

    return Object.assign(includeData, transformed)
  }

  _isRequested (checkScopeSegment) {
    let scopeArray

    if (this._scopeIdentifier) {
      scopeArray = [...this._parentScopes, this._scopeIdentifier, checkScopeSegment]
    } else {
      scopeArray = [checkScopeSegment]
    }

    let scopeString = scopeArray.join('.')

    return this._manager.getRequestedIncludes().has(scopeString)
  }

  _getCollectionRows (data) {
    if (data.hasOwnProperty('rows')) {
      return data.rows
    }
    return data
  }

  _getTransformerInstance (Transformer) {
    if (Transformer.prototype instanceof TransformerAbstract) {
      return new Transformer()
    }

    class ClosureTransformer extends TransformerAbstract {
      transform (data) { return Transformer(data) }
    }
    ClosureTransformer.transform = Transformer

    return new ClosureTransformer()
  }

  setParentScopes (parentScopes) {
    this._parentScopes = parentScopes
  }

  getParentScopes () {
    return this._parentScopes
  }

  getScopeIdentifier () {
    return this._scopeIdentifier
  }
}

module.exports = Scope
