'use strict';

var ModelUtil         = require('bpmn-js/lib/util/ModelUtil'),
    is                = ModelUtil.is,
    getBusinessObject = ModelUtil.getBusinessObject;

var elementHelper = require('../../../../helper/ElementHelper'),
    extensionElementsHelper = require('../../../../helper/ExtensionElementsHelper'),
    inputOutputHelper = require('../../../../helper/InputOutputHelper'),
    cmdHelper = require('../../../../helper/CmdHelper');

var extensionElementsEntry = require('./ExtensionElements');


function getInputOutput(element) {
  return inputOutputHelper.getInputOutput(element);
}

function getInputParameters(element) {
  return inputOutputHelper.getInputParameters(element);
}

function getOutputParameters(element) {
  return inputOutputHelper.getOutputParameters(element);
}

function getInputParameter(element, idx) {
  return inputOutputHelper.getInputParameter(element, idx);
}

function getOutputParameter(element, idx) {
  return inputOutputHelper.getOutputParameter(element, idx);
}


function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

function createInputOutput(parent, bpmnFactory, properties) {
  return createElement('camunda:InputOutput', parent, bpmnFactory, properties);
}

function createParameter(type, parent, bpmnFactory, properties) {
  return createElement(type, parent, bpmnFactory, properties);
}


function ensureInputOutputSupported(element) {
  return inputOutputHelper.isInputOutputSupported(element);
}

function ensureOutparameterSupported(element) {
  return inputOutputHelper.areOutputParametersSupported(element);
}

var TYPE_LABEL = {
  'camunda:Map': 'Map',
  'camunda:List': 'List',
  'camunda:Script': 'Script'
};

module.exports = function(element, bpmnFactory, options) {

  options = options || {};

  var idPrefix = options.idPrefix || '';
  var context = element;

  var getSelected = function(element, node) {
    var selection = (inputEntry && inputEntry.getSelected(element, node)) || { idx: -1 };

    var parameter = getInputParameter(element, selection.idx);
    if (!parameter && outputEntry) {
      selection = outputEntry.getSelected(element, node);
      parameter = getOutputParameter(element, selection.idx);
    }
    return parameter;
  };

  var result = {
    getSelectedParameter: getSelected
  };

  var entries = result.entries = [];

  console.log('ensureInputOutputSupported');
  console.log(element);
  console.log(context);
  if (!ensureInputOutputSupported(element)) {
    console.log('FALIEDDDDDDDDDDDDDDDDDDDDDDD');
    return result;
  }

  var newElement = function(type, prop, factory) {

    return function(element, extensionElements, value) {
      var commands = [];
      
      var parent = (element != context) ? context : element;
      var currentContext = (element != context) ? context : extensionElements;

      var inputOutput = getInputOutput(currentContext);
      console.log('newElement');
      console.log(currentContext);
      if (!inputOutput) {
        var referencePropertyName = is(currentContext, 'camunda:Connector') ? 'camunda:Connector' : 'extensionElements';
        console.log('referencePropertyName='+referencePropertyName)
        inputOutput = createInputOutput(currentContext, bpmnFactory, {
          inputParameters: [],
          outputParameters: []
        });

        commands.push(cmdHelper.addAndRemoveElementsFromList(
          parent,
          currentContext,
          'values',
          referencePropertyName,
          [ inputOutput ],
          []
        ));
      }

      var newElem = createParameter(type, inputOutput, bpmnFactory, { name: value });
      commands.push(cmdHelper.addElementsTolist(currentContext, inputOutput, prop, [ newElem ]));

      return commands;
    };
  };

  var removeElement = function(getter, prop, otherProp) {
    return function(element, extensionElements, value, idx) {
      var currentContext = (element != context) ? context : extensionElements;
      var inputOutput = getInputOutput(currentContext);
      var parameter = getter(currentContext, idx);

      var commands = [];
      commands.push(cmdHelper.removeElementsFromList(currentContext, inputOutput, prop, null, [ parameter ]));

      var firstLength = inputOutput.get(prop).length-1;
      var secondLength = (inputOutput.get(otherProp) || []).length;

      if (!firstLength && !secondLength) {
        commands.push(extensionElementsHelper.removeEntry(currentContext, element, inputOutput));
      }

      return commands;
    };
  };

  var setOptionLabelValue = function(getter) {
    return function(element, node, option, property, value, idx) {
      var parameter = getter(element, idx);

      var suffix = 'Text';

      var definition = parameter.get('definition');
      if (typeof definition !== 'undefined') {
        var type = definition.$type;
        suffix = TYPE_LABEL[type];
      }

      option.text = (value || '') + ' : ' + suffix;
    };
  };


  // input parameters ///////////////////////////////////////////////////////////////

  console.log('CONTAERXTTTTTTTTTTTTTTTTTTTTTTTT');
  console.log(element);
  var inputEntry = extensionElementsEntry(element, bpmnFactory, {
    id: idPrefix + 'inputs',
    label: 'Input Parameters',
    modelProperty: 'name',
    prefix: 'Input',
    resizable: true,

    createExtensionElement: newElement('camunda:InputParameter', 'inputParameters'),
    removeExtensionElement: removeElement(getInputParameter, 'inputParameters', 'outputParameters'),

    getExtensionElements: function(element) {
      return getInputParameters(element);
    },

    onSelectionChange: function(element, node, event, scope) {
      outputEntry && outputEntry.deselect(element, node);
    },

    setOptionLabelValue: setOptionLabelValue(getInputParameter)

  });
  entries.push(inputEntry);


  // output parameters ///////////////////////////////////////////////////////

  if (ensureOutparameterSupported(element)) {
    var outputEntry = extensionElementsEntry(element, bpmnFactory, {
      id: idPrefix + 'outputs',
      label: 'Output Parameters',
      modelProperty: 'name',
      prefix: 'Output',
      resizable: true,

      createExtensionElement: newElement('camunda:OutputParameter', 'outputParameters'),
      removeExtensionElement: removeElement(getOutputParameter, 'outputParameters', 'inputParameters'),

      getExtensionElements: function(element) {
        console.log('getExtensionElements');
        console.log(element);
        return getOutputParameters(element);
      },

      onSelectionChange: function(element, node, event, scope) {
        inputEntry.deselect(element, node);
      },

      setOptionLabelValue: setOptionLabelValue(getOutputParameter)

    });
    entries.push(outputEntry);
  }

  return result;

};
