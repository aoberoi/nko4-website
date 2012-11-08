util = require 'util'

module.exports = (app) ->
  Team = app.db.model 'Team'

  (req, res, next) ->
    if req.method is 'POST' and m = req.url.match /^\/teams\/(.+)\/commits$/
      util.log "#{'POST-RECEIVE'.magenta} #{req.url}"
      console.dir req.body

      code = decodeURIComponent m[1]
      Team.findOne code: code, (err, team) ->
        return next err if err
        return next 404 unless team
        try
          payload = JSON.parse req.body.payload
          util.log payload
          for commit in payload.commits
            app.events.emit 'commit', commit, team
        catch e
          return next e
        res.send 200
    else next()
