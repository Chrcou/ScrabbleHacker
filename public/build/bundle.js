
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    async function getTextFile(url) {
        let response = await fetch(url);
        let json = await response.json();
        return json;
    }

    class wordDictionnary {
        constructor(url) {
            this.dictionnary = [];
            this.countTable = {
                A: 1,
                E: 1,
                I: 1,
                L: 1,
                N: 1,
                O: 1,
                R: 1,
                S: 1,
                T: 1,
                U: 1,
                D: 2,
                G: 2,
                M: 2,
                B: 3,
                C: 3,
                P: 3,
                F: 4,
                H: 4,
                V: 4,
                J: 8,
                Q: 8,
                K: 10,
                W: 10,
                X: 10,
                Y: 10,
                Z: 10,
            };
            this.url = url;
            getTextFile(this.url).then((value) => {
                this.dictionnary = value.data.map((word) => {
                    return this.removeAccent(word).toUpperCase();
                });
                //console.log(this.dictionnary);
                // //console.log(this.search('€h€€€€',0,'btne'));
            });
        }
        replaceAll(str, find, replace) {
            return str.replace(new RegExp(find, "g"), replace);
        }
        /**
         * Will search an expression based on the "expression" parameter
         * @param expression a word without some letters. All missing letters must be replaced by "€"
         * @param stringLength the wished caracters number
         * @param caracterList the list of letter which the player has in his hand (example : "abcd")
         * @returns a list of found word
         */
        search(expression, stringLength = 0, caracterList = "") {
            let regexpArgument;
            let baseDictionnary;
            if (caracterList === "") {
                regexpArgument = "[a-zA-Z]";
            }
            else {
                regexpArgument = "[" + caracterList + "]";
            }
            let myRegExp = new RegExp(this.replaceAll(expression, "€", regexpArgument), "i");
            //console.log(myRegExp);
            if (stringLength === 0) {
                baseDictionnary = this.dictionnary;
            }
            else {
                baseDictionnary = this.dictionnary.filter((str) => {
                    return str.length <= stringLength;
                });
            }
            return baseDictionnary
                .filter((str) => {
                const matchArray = str.match(myRegExp);
                if (matchArray) {
                    return true;
                }
                else {
                    return false;
                }
            })
                .map((word) => {
                return { word: word, score: this.countPoint(word) };
            }).sort((a, b) => {
                return b.score - a.score;
            });
        }
        countPoint(word) {
            return [...word].reduce((previousValue, currentValue) => {
                return previousValue + this.countTable[currentValue];
            }, 0);
        }
        removeAccent(str) {
            var accent = [
                /[\300-\306]/g,
                /[\340-\346]/g,
                /[\310-\313]/g,
                /[\350-\353]/g,
                /[\314-\317]/g,
                /[\354-\357]/g,
                /[\322-\330]/g,
                /[\362-\370]/g,
                /[\331-\334]/g,
                /[\371-\374]/g,
                /[\321]/g,
                /[\361]/g,
                /[\307]/g,
                /[\347]/g, // C, c
            ];
            var noaccent = [
                "A",
                "a",
                "E",
                "e",
                "I",
                "i",
                "O",
                "o",
                "U",
                "u",
                "N",
                "n",
                "C",
                "c",
            ];
            // var str = this;
            for (var i = 0; i < accent.length; i++) {
                str = str.replace(accent[i], noaccent[i]);
            }
            return str;
        }
    }

    /* src/components/wordInput/wordInput.svelte generated by Svelte v3.46.3 */
    const file$1 = "src/components/wordInput/wordInput.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each results as result}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*result*/ ctx[9].word + "";
    	let t0;
    	let t1;
    	let t2_value = /*result*/ ctx[9].score + "";
    	let t2;
    	let t3;
    	let t4_value = /*result*/ ctx[9].word.length + "";
    	let t4;
    	let t5;
    	let a;
    	let t6;
    	let a_href_value;
    	let t7;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = text("pts - ");
    			t4 = text(t4_value);
    			t5 = text(" lettres\n      ");
    			a = element("a");
    			t6 = text("(voir la défintion)");
    			t7 = space();
    			attr_dev(a, "href", a_href_value = "https://www.larousse.fr/dictionnaires/francais/" + /*result*/ ctx[9].word);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-16tqipq");
    			add_location(a, file$1, 46, 6, 1442);
    			attr_dev(li, "class", "svelte-16tqipq");
    			add_location(li, file$1, 44, 4, 1360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    			append_dev(li, a);
    			append_dev(a, t6);
    			append_dev(li, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*results*/ 1 && t0_value !== (t0_value = /*result*/ ctx[9].word + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*results*/ 1 && t2_value !== (t2_value = /*result*/ ctx[9].score + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*results*/ 1 && t4_value !== (t4_value = /*result*/ ctx[9].word.length + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*results*/ 1 && a_href_value !== (a_href_value = "https://www.larousse.fr/dictionnaires/francais/" + /*result*/ ctx[9].word)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:2) {#each results as result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let input1_id_value;
    	let t5;
    	let label1;
    	let t7;
    	let input2;
    	let t8;
    	let h1;
    	let t10;
    	let ol;
    	let mounted;
    	let dispose;
    	let each_value = /*results*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "wordInput works !";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Nombre de lettre souhaité";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Je dispose des lettre suivantes";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			h1 = element("h1");
    			h1.textContent = "Résultats";
    			t10 = space();
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-16tqipq");
    			add_location(div, file$1, 27, 0, 836);
    			attr_dev(label0, "for", "charNumber");
    			attr_dev(label0, "class", "svelte-16tqipq");
    			add_location(label0, file$1, 28, 0, 865);
    			attr_dev(input0, "type", "number");
    			input0.value = /*charNumber*/ ctx[1];
    			attr_dev(input0, "name", "charNumber");
    			attr_dev(input0, "min", "3");
    			attr_dev(input0, "max", "29");
    			attr_dev(input0, "class", "svelte-16tqipq");
    			add_location(input0, file$1, 29, 0, 924);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "maxlength", /*charNumber*/ ctx[1]);
    			attr_dev(input1, "id", input1_id_value = "wordInput" + /*charNumber*/ ctx[1]);
    			attr_dev(input1, "class", "svelte-16tqipq");
    			add_location(input1, file$1, 31, 0, 1035);
    			attr_dev(label1, "for", "myLetter");
    			attr_dev(label1, "class", "svelte-16tqipq");
    			add_location(label1, file$1, 38, 0, 1147);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "myLetters");
    			attr_dev(input2, "class", "svelte-16tqipq");
    			add_location(input2, file$1, 39, 0, 1209);
    			attr_dev(h1, "class", "svelte-16tqipq");
    			add_location(h1, file$1, 41, 0, 1282);
    			attr_dev(ol, "class", "gradient-list svelte-16tqipq");
    			add_location(ol, file$1, 42, 0, 1301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, input0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, input1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, label1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, input2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*changeCharNumber*/ ctx[2], false, false, false),
    					listen_dev(input1, "input", /*searchFromTextInput*/ ctx[3], false, false, false),
    					listen_dev(input2, "input", /*searchFromLetterInput*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*charNumber*/ 2 && input0.value !== /*charNumber*/ ctx[1]) {
    				prop_dev(input0, "value", /*charNumber*/ ctx[1]);
    			}

    			if (dirty & /*charNumber*/ 2) {
    				attr_dev(input1, "maxlength", /*charNumber*/ ctx[1]);
    			}

    			if (dirty & /*charNumber*/ 2 && input1_id_value !== (input1_id_value = "wordInput" + /*charNumber*/ ctx[1])) {
    				attr_dev(input1, "id", input1_id_value);
    			}

    			if (dirty & /*results*/ 1) {
    				each_value = /*results*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WordInput', slots, []);
    	let results = [];
    	let letterList = "";
    	let searched = "";
    	let charNumber = 3;
    	let searchedExpression;

    	const changeCharNumber = e => {
    		$$invalidate(1, charNumber = e.target.value);
    	}; ////console.log(charNumber);

    	let dictionnary = new wordDictionnary("/liste_francais.json");

    	const searchFromTextInput = event => {
    		searched = event.target.value.toUpperCase();

    		////console.log(searched);
    		if (searched.length > 2) {
    			$$invalidate(0, results = dictionnary.search(searched, Number(charNumber), letterList));
    		}
    	};

    	const searchFromLetterInput = event => {
    		letterList = event.target.value;

    		////console.log(letterList);
    		if (searched.length > 2) {
    			$$invalidate(0, results = dictionnary.search(searched, Number(charNumber), letterList));
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WordInput> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		wordDictionnary,
    		results,
    		letterList,
    		searched,
    		charNumber,
    		searchedExpression,
    		changeCharNumber,
    		dictionnary,
    		searchFromTextInput,
    		searchFromLetterInput
    	});

    	$$self.$inject_state = $$props => {
    		if ('results' in $$props) $$invalidate(0, results = $$props.results);
    		if ('letterList' in $$props) letterList = $$props.letterList;
    		if ('searched' in $$props) searched = $$props.searched;
    		if ('charNumber' in $$props) $$invalidate(1, charNumber = $$props.charNumber);
    		if ('searchedExpression' in $$props) searchedExpression = $$props.searchedExpression;
    		if ('dictionnary' in $$props) dictionnary = $$props.dictionnary;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		results,
    		charNumber,
    		changeCharNumber,
    		searchFromTextInput,
    		searchFromLetterInput
    	];
    }

    class WordInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WordInput",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.3 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let a;
    	let t6;
    	let t7;
    	let wordinput;
    	let current;
    	wordinput = new WordInput({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			p = element("p");
    			t4 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t6 = text(" to learn how to build Svelte apps.");
    			t7 = space();
    			create_component(wordinput.$$.fragment);
    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file, 6, 1, 184);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file, 7, 14, 221);
    			add_location(p, file, 7, 1, 208);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 5, 0, 176);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, t4);
    			append_dev(p, a);
    			append_dev(p, t6);
    			insert_dev(target, t7, anchor);
    			mount_component(wordinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wordinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wordinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t7);
    			destroy_component(wordinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ WordInput, name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'Scrabble HACKER !'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
