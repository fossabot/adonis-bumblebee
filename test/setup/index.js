'use strict'

const { ioc, registrar } = require('@adonisjs/fold')
const { Config } = require('@adonisjs/sink')
const path = require('path')
const Macroable = require('macroable')

class Context extends Macroable {
  static onReady () {}
  constructor () {
    super()
    this.env = 'testing'
    this.params = {}
  }
}
Context._getters = {}
Context._macros = {}

module.exports = async () => {
  ioc.bind('Adonis/Src/HttpContext', () => {
    return Context
  })

  ioc.singleton('Adonis/Src/Config', () => {
    const config = new Config()

    config.set('bumblebee', {
      parseRequest: false,
      includeRecursionLimit: 10
    })

    return config
  })

  await registrar.providers([
    path.join(__dirname, '../../providers/BumblebeeProvider')
  ]).registerAndBoot()
}
