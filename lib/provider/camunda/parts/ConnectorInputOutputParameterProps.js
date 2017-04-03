'use strict';

var assign = require('lodash/object/assign');

var inputOutputParameter = require('./implementation/InputOutputParameter');
var getConnector = require('../element-templates/Helper').getConnector;

module.exports = function(group, element, bpmnFactory, options) {

  options = assign({
    idPrefix: 'connector-',
    context: null
  }, options);

  group.entries = group.entries.concat(inputOutputParameter(getConnector(element), bpmnFactory, options));

};
