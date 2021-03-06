var $, jQuery;
$ = jQuery = require("ep_etherpad-lite/static/js/rjquery").$;
var _ = require("underscore");

var pluginUtils = require('./shared');
var defs = require('./plugin_defs');

exports.baseURL = '';

exports.ensure = function (cb) {
  if (!defs.loaded)
    exports.update(cb);
  else
    cb();
};

exports.update = function (cb) {
  // It appears that this response (see #620) may interrupt the current thread
  // of execution on Firefox. This schedules the response in the run-loop,
  // which appears to fix the issue.
  var callback = function () {setTimeout(cb, 0);};
  $.ajaxSetup({ cache: false });
  jQuery.getJSON(exports.baseURL + 'pluginfw/plugin-definitions.json').done(function(data) {
    defs.plugins = data.plugins;
    defs.parts = data.parts;
    defs.hooks = pluginUtils.extractHooks(defs.parts, "client_hooks");
    defs.loaded = true;
    callback();
  }).fail(function(e){
    console.error("Failed to load plugin-definitions: " + err);
    callback();
  });
};

function adoptPluginsFromAncestorsOf(frame) {
  // Bind plugins with parent;
  var parentRequire = null;
  try {
    while (frame = frame.parent) {
      if (typeof (frame.require) !== "undefined") {
        parentRequire = frame.require;
        break;
      }
    }
  } catch (error) {
    // Silence (this can only be a XDomain issue).
  }
  if (parentRequire) {
    var ancestorPluginDefs = parentRequire("ep_etherpad-lite/static/js/pluginfw/plugin_defs");
    defs.hooks = ancestorPluginDefs.hooks;
    defs.loaded = ancestorPluginDefs.loaded;
    defs.parts = ancestorPluginDefs.parts;
    defs.plugins = ancestorPluginDefs.plugins;
    var ancestorPlugins = parentRequire("ep_etherpad-lite/static/js/pluginfw/client_plugins");
    exports.baseURL = ancestorPlugins.baseURL;
    exports.ensure = ancestorPlugins.ensure;
    exports.update = ancestorPlugins.update;
  } else {
    throw new Error("Parent plugins could not be found.")
  }
}

exports.adoptPluginsFromAncestorsOf = adoptPluginsFromAncestorsOf;
