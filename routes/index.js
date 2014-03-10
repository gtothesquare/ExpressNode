var constants = require('../constants.js');

exports.index = function(req, res) {
  res.sendfile(constants.VIEW_DIR + 'index.html');
};