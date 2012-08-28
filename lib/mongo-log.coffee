require 'colors'
inspect = require('util').inspect

module.exports = (mongo) ->
  write = mongo.Connection.prototype.write

  commandName = (command) ->
    switch command.constructor
      when mongo.BaseCommand        then 'base'
      when mongo.DbCommand          then 'db'
      when mongo.DeleteCommand      then 'delete'
      when mongo.GetMoreCommand     then 'get_more'
      when mongo.InsertCommand      then 'insert'
      when mongo.KillCursorCommand  then 'kill_cursor'
      when mongo.QueryCommand       then 'query'
      when mongo.UpdateCommand      then 'update'
      else command

  log = (command) ->
    output = collectionName: command.collectionName
    for k in [ 'query', 'documents', 'spec', 'document', 'selector', \
               'returnFieldSelector', 'numberToSkip', 'numberToReturn' ]
      output[k] = command[k] if command[k]
    console.log "#{commandName(command).underline}: #{inspect(output, null, 8)}".grey

  mongo.Connection.prototype.write = (db_command, callback) ->
    return unless db_command

    if db_command.constructor == Array
      log command for command in db_command
    else
      log db_command
    write.apply this, arguments

    ###
    ms = Date.now()
    executeCommand.call this, db_command, options, ->
      took = Date.now() - ms
      console.log inspect(output, null, 8) + ' ' + took + ' ms'
      callback = options if !callback && typeof(options) == 'function'
      callback.apply this, arguments if callback
    ###
