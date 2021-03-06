const express = require('express')
const request = require('request')
const connections = require('./connections')

const app = express()

app.all('/*', (req, res) => {
  let url = null
  let token = null

  if (req.query['u']) {
    // Remote URL provided by the client
    url = req.query['u'] + '/' + req.params['0']
    token = req.query['t']
  }
  else if (req.query['n']) {
    // The client has only provided a name, so get the url from the configuration
    const foundConnection = connections.filter(conn => conn.name == req.query['n'])
    
    if (foundConnection.length > 0) {
      url = foundConnection[0].url + '/' + req.params['0']
      token = foundConnection[0].token
    }
  }

  if (!url) {
    res.status(400).send('Unknown connection')
  }
  else {
    const reqOptions = { method: req.method, url }

    if (token) {
      reqOptions.headers = {
        'Authorization': 'Bearer ' + token
      }
    }

    request(reqOptions)
      .on('error', function(err) {
        console.error(err)
        let code = 500
        if (err.message.indexOf('ECONNREFUSED') > -1) {
          code = 504
        }
        else if (err.message.indexOf('ENOTFOUND') > -1) {
          code = 502
        }
        // Other errors ?
        res.status(code).send('Proxy error: ' + err.message)
      })
      .pipe(res)
    }
})

module.exports = {
  path: '/api',
  handler: app
}
