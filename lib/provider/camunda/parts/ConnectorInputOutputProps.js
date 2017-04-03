'use strict';

var inputOutput = require('./implementation/InputOutput');
var getConnector = require('../element-templates/Helper').getConnector;

module.exports = function(group, element, bpmnFactory) {

  console.log('ConnectioIO')
  console.log(element)
  console.log(getConnector(element))
  var inputOutputEntry = inputOutput(getConnector(element), bpmnFactory, {
    idPrefix: 'connector-',
    content: null
  });
  console.log(inputOutputEntry)

  group.entries = group.entries.concat(inputOutputEntry.entries);

  return {
    getSelectedParameter: inputOutputEntry.getSelectedParameter
  };

};
