const debug = require('debug')('expressa')
const util = require('./util')

module.exports = function (api) {
  /* Listeners to avoid the need for a server restart */
  api.addCollectionListener('changed', 'collection', function setupNewCollections (req, collection, data) {
    if (!(data.storage === 'memory' && util.getPath(api.db[data._id], 'type') === 'memory')) {
      api.setupCollectionDb(data)
    }
    debug('updated ' + data._id + ' collection storage')
  })
  api.addCollectionListener('delete', 'collection', function cleanupCollections (req, collection, data) {
    delete api.db[data._id]
    debug('removed ' + data._id + ' collection storage')
  })
  api.addCollectionListener('changed', 'settings', function updateSettings (req, collection, data) {
    // TODO: only reload if current environment is updated
    Object.assign(req.settings, data)
  })

  api.addListener('post', function updateMetadata (req, collection, data) {
    data.meta = data.meta || {}
    data.meta.created = new Date().toISOString()
    data.meta.updated = new Date().toISOString()
    if (req.user) {
      data.meta.owner = req.user._id
    }
  })

  api.addListener('put', function updateMetadata (req, collection, data) {
    data.meta = data.meta || {}
    data.meta.updated = new Date().toISOString()
  })

  api.addCollectionListener('get', 'schemas', function addMetaToSchema (req, collection, data) {
    const schema = data.schema
    schema.properties.meta = {
      type: 'object',
      propertyOrder: 2000,
      properties: {
        created: {
          type: 'string'
        },
        updated: {
          type: 'string'
        }
      }
    }
    if (data.documentsHaveOwners) {
      schema.properties.meta.properties.owner = {
        type: 'string',
        links: [
          {
            rel: '» view owner user',
            href: '/admin/#/edit/users/{{self}}',
            class: 'comment-link open-in-modal primary-text'
          }
        ]
      }
    }
  })
}
