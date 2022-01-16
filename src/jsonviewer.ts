function encodeEntities(str: string) {
	return str.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
		return '&#'+i.charCodeAt(0)+';';
	});
}

export function jsonViewer(json: { [key: string|number]: string }, collapsible=false) {
	var TEMPLATES = {
			item: '<div class="json__item"><div class="json__key">%KEY%</div><div class="json__value json__value--%TYPE%">%VALUE%</div></div>',
			itemCollapsible: '<label class="json__item json__item--collapsible"><input type="checkbox" class="json__toggle"/><div class="json__key">%KEY%</div><div class="json__value json__value--type-%TYPE%">%VALUE%</div>%CHILDREN%</label>',
			itemCollapsibleOpen: '<label class="json__item json__item--collapsible"><input type="checkbox" checked class="json__toggle"/><div class="json__key">%KEY%</div><div class="json__value json__value--type-%TYPE%">%VALUE%</div>%CHILDREN%</label>'
	};

	function createItem(key: string, value: string, type: string){
			var element = TEMPLATES.item.replace('%KEY%', key);

			if(type == 'string') {
					element = element.replace('%VALUE%', '"' + encodeEntities(value) + '"');
			} else {
					element = element.replace('%VALUE%', value);
			}

			element = element.replace('%TYPE%', type);

			return element;
	}

	function createCollapsibleItem(key: string, type: string, children: string){
			const tpl = collapsible ? 'itemCollapsibleOpen' : 'itemCollapsible'
			
			var element = TEMPLATES[tpl].replace('%KEY%', key);

			element = element.replace('%VALUE%', type);
			element = element.replace('%TYPE%', type);
			element = element.replace('%CHILDREN%', children);

			return element;
	}

	function handleChildren(key: string, value: string[], type: string) {
			var html = '';

			for(var item in value) { 
					var _key = item,
							_val = value[item];

					html += handleItem(_key, _val);
			}

			return createCollapsibleItem(key, type, html);
	}

	function handleItem(key: string, value: string) {
			var type = typeof value;

			if(typeof value === 'object') {        
					return handleChildren(key, value, type);
			}

			return createItem(key, value, type);
	}

	function parseObject(obj: { [key: string|number]: string }) {
			let _result = '<div class="json">';

			for(var item in obj) { 
					var key = item,
							value = obj[item];

					_result += handleItem(key, value);
			}

			_result += '</div>';

			return _result;
	}
	
	return parseObject(json);
};