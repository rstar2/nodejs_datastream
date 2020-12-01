(function () {
	'use strict';

	var isMergeableObject = function isMergeableObject(value) {
		return isNonNullObject(value)
			&& !isSpecial(value)
	};

	function isNonNullObject(value) {
		return !!value && typeof value === 'object'
	}

	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);

		return stringValue === '[object RegExp]'
			|| stringValue === '[object Date]'
			|| isReactElement(value)
	}

	// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
	var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
	var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE
	}

	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {}
	}

	function cloneUnlessOtherwiseSpecified(value, options) {
		return (options.clone !== false && options.isMergeableObject(value))
			? deepmerge(emptyTarget(value), value, options)
			: value
	}

	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map(function(element) {
			return cloneUnlessOtherwiseSpecified(element, options)
		})
	}

	function getMergeFunction(key, options) {
		if (!options.customMerge) {
			return deepmerge
		}
		var customMerge = options.customMerge(key);
		return typeof customMerge === 'function' ? customMerge : deepmerge
	}

	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols
			? Object.getOwnPropertySymbols(target).filter(function(symbol) {
				return target.propertyIsEnumerable(symbol)
			})
			: []
	}

	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
	}

	function propertyIsOnObject(object, property) {
		try {
			return property in object
		} catch(_) {
			return false
		}
	}

	// Protects from prototype poisoning and unexpected merging up the prototype chain.
	function propertyIsUnsafe(target, key) {
		return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
			&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
				&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
	}

	function mergeObject(target, source, options) {
		var destination = {};
		if (options.isMergeableObject(target)) {
			getKeys(target).forEach(function(key) {
				destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
			});
		}
		getKeys(source).forEach(function(key) {
			if (propertyIsUnsafe(target, key)) {
				return
			}

			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
				destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
			} else {
				destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
			}
		});
		return destination
	}

	function deepmerge(target, source, options) {
		options = options || {};
		options.arrayMerge = options.arrayMerge || defaultArrayMerge;
		options.isMergeableObject = options.isMergeableObject || isMergeableObject;
		// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
		// implementations can use it. The caller may not replace it.
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

		var sourceIsArray = Array.isArray(source);
		var targetIsArray = Array.isArray(target);
		var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

		if (!sourceAndTargetTypesMatch) {
			return cloneUnlessOtherwiseSpecified(source, options)
		} else if (sourceIsArray) {
			return options.arrayMerge(target, source, options)
		} else {
			return mergeObject(target, source, options)
		}
	}

	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) {
			throw new Error('first argument should be an array')
		}

		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, options)
		}, {})
	};

	var deepmerge_1 = deepmerge;

	var cjs = deepmerge_1;

	/* globals Highcharts:false */

	let currentChart = null;

	const defOptions = {
	  title: {
	    text: 'Trace',
	  },
	  chart: {
	    width: 1000,
	    height: 500,
	    type: 'line',
	    zoomType: 'x',
	    // scrollablePlotArea: {
	    //   minWidth: 100,
	    //   scrollPositionX: 1,
	    // },
	  },
	  xAxis: {
	    scrollbar: {
	      enabled: true,
	    },
	    // tickLength: 0,
	  },
	  //   yAxis: {},
	};

	/**
	 * Create/update the Highcharts chart for given data
	 * @param  {[[number, number]][]} traces
	 * @param  {Object} extraOpts
	 */
	function update(traces, extraOpts = {}) {
	  // destroy any previous chart (to avoid memory leaks)
	  if (currentChart) currentChart.destroy();

	  const series = traces.map((trace) => {
	    return {
	      data: trace,
	      marker: {
	        radius: 2,
	      },
	    };
	  });

	  const opts = cjs.all([
	    defOptions,
	    extraOpts,
	    {
	      series,
	    },
	  ]);
	  currentChart = Highcharts.chart('myHighcharts', opts);

	  // export it tom window, so that it could be used from external scripts, or like it is done now form jsdom
	  window.highchartsChart = currentChart;
	}

	var chart = /*#__PURE__*/Object.freeze({
		__proto__: null,
		update: update
	});

	/**
	 * Parse given file
	 * @param {File} file
	 * @return {[[number, number]][]} parsed data ready to be put in a chart
	 */
	async function readFile (file) {
	  return new Promise((resolve, reject) => {
	    const reader = new FileReader();

	    reader.addEventListener('load', (event) => {
	      resolve(event.target.result); // same as resolve(reader.result);
	    });
	    reader.addEventListener('error', (event) => {
	      alert('Failed to read file!\n\n' + reader.error);
	      reject(event.target.error); // same as reject(reader.error);
	    });

	    reader.readAsText(file);
	  });
	}

	/**
	 * Parse a single line.
	 * Example:
	 *   in  =>  288 86 0 0
	 *   out =>  288,86
	 * @param {String} line
	 * @return {[number, number]|null}
	 */
	const parseLine = function (line) {
	  line = line.trim();
	  if (!line) return null;

	  const parts = line.split(' ');
	  if (parts.length >= 2) {
	      console.log('ups');
	      
	    return [+parts[0], +parts[1]];
	  }

	  return null;
	};

	/**
	 *
	 * @param {String} lines
	 * @return {[number, number][]}
	 */
	const parseFile = function (lines) {
	  return lines.split(/\r?\n|\r(?!\n)/).reduce((res, line) => {
	    const entry = parseLine(line);
	    entry && res.push(entry);
	    return res;
	  }, []);
	};
	var parseFile_1 = parseFile;

	const fileSelectEl = document.getElementById('fileSelect');
	const fileUploadEl = document.getElementById('fileUpload');

	// when clicked trigger the file-input select
	fileSelectEl.addEventListener('click', fileUploadEl.click.bind(fileUploadEl));

	// when file is selected
	fileUploadEl.addEventListener('change', async (event) => {
	  // get the single selected file
	  const file = event.target.files[0];
	  if (!file) return;

	  let data = await readFile(file);
	  data = parseFile_1(data);
	  //   console.log('data', data);
	  update([data]);
	});

	// export it tom window, so that it could be used from external scripts, or like it is done now form jsdom
	window.chart = chart;

}());
//# sourceMappingURL=bundle.js.map
