angular.module('dockerpedia.controllers').controller('describeCtrl', describeCtrl);

describeCtrl.$inject = ['$scope', '$location', '$http']

function describeCtrl (scope, location, http) {
  var endpoint = "http://ontosoft.isi.edu:3030/ds/query";
  var vm = this;
  vm.toPrefix = toPrefix;
  vm.getValues = getValues;
  vm.properties = [];
  vm.propertiesReverse = [];
  vm.getValuesReverse = getValuesReverse;

  vm.values = {};
  var prefixes = [
    {prefix: 'rdf:',   uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"},
    {prefix: 'rdfs:',  uri: "http://www.w3.org/2000/01/rdf-schema#"},
    {prefix: 'owl:',   uri: "http://www.w3.org/2002/07/owl#"},
    {prefix: 'mint:', uri: "https://w3id.org/mint/modelCatalog#"},
    {prefix: 'purl:', uri: "http://purl.org/dc/terms/"},
    {prefix: 'onsw:', uri: "http://ontosoft.org/software#"},

  ];

  vm.absUrl = location.absUrl();
  vm.uri = vm.absUrl.replace('#!#','#').replace("http","https").replace("localhost:7070","w3id.org");

  execQuery(propertiesQuery(vm.uri), data => {
    vm.properties = data.results.bindings;
  });

  execQuery(propertiesQueryReverse(vm.uri), data => {
    vm.propertiesReverse = data.results.bindings;
  });

  function changeURI( data ){
    for (i=0; i<data.results.bindings.length; i++) {
      if (data.results.bindings[i]['uri'] != undefined) {
        //force redirect w3id to localhost
        data.results.bindings[i]['uri']['value'] = data.results.bindings[i]['uri']['value'].replace('https://w3id.org/mint/instance','http://localhost:7070/mint/instance')
      }
    }
    return data
  }

  function getValues (prop, i) {
    if (i > 0) prop.step += 1;
    if (i < 0) prop.step -= 1;
    execQuery(valuesQuery(vm.uri, prop.uri.value, prop.step), data => {
      data = changeURI(data)
      vm.values[prop.uri.value] = data.results.bindings;
    });

  }

  function getValuesReverse (prop, i) {
    console.log("here")
    if (i > 0) prop.step += 1;
    if (i < 0) prop.step -= 1;
    execQuery(valuesQueryReserve(vm.uri, prop.uri.value, prop.step), data => {
      data = changeURI(data)
      vm.values[prop.uri.value] = data.results.bindings;
    });
  }

  function toPrefix (uri) {
    //transform this uri to prefix notation.
    for (var i in prefixes) {
      if (uri.includes(prefixes[i].uri)) {
        return uri.replace(prefixes[i].uri, prefixes[i].prefix);
      }
    }
    return uri;
  }

  /* query helpers */
  function propertiesQuery (uri) {
    q = 'SELECT DISTINCT ?uri ?label WHERE {\n';
    q+= '  <' + uri + '> ?uri [] .\n';
    q+= '  OPTIONAL {?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label .} \n'
    q+= '}';
    return q;
  }

  /* query helpers */
  function propertiesQueryReverse (uri) {
    q = 'SELECT DISTINCT ?uri ?label WHERE {\n';
    q+= ' [] ?uri   <' + uri + '> .\n';
    q+= '  OPTIONAL {?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label .} \n'
    q+= '}';
    return q;
  }

  /* query helpers */
  function valuesQuery (uri, prop, step) { //TODO: limit, offset and pagination.
    q = 'SELECT DISTINCT ?uri ?label WHERE {\n';
    q+= '  <' + uri + '> <' + prop + '> ?uri .\n';
    q+= '  OPTIONAL {?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label .} \n'
    q+= '} limit 11 offset ' + (step)*10;
    return q;
  }

  /* query helpers */
  function valuesQueryReserve (uri, prop, step) { //TODO: limit, offset and pagination.
    q = 'SELECT DISTINCT ?uri ?label WHERE {\n';
    q+= '  ?uri  <' + prop + '> <' + uri + '>.\n';
    q+= '  OPTIONAL {?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label .} \n'
    q+= '} limit 11 offset ' + (step)*10;
    return q;
  }

  /* send query to the endpoint */
  function toForm (obj) {
    var str = [];
    for(var p in obj)
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  }

  function execQuery (query, callback) {
    http({
        method: 'post',
        url: endpoint,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformRequest: toForm, 
        data: { query: query, format: "application/sparql-results+json" }
    }).then(
      function onSuccess (response) { callback(response.data); },
      function onError   (response) { console.log('Error: ', response); }
    );
  }
}
