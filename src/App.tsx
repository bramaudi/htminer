import { onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/theme/material-darker.css'
import './custom.css'
import './jsonviewer.css'
import CodeMirror from 'codemirror'
import { jsonViewer } from './jsonviewer'
import initialscript from './script.txt?raw'

Element.prototype.find = function(query) {
	return this.querySelector(query)
}
Element.prototype.findAll = function(query) {
	return this.querySelectorAll(query)
}

const CRAWL_SERVER = import.meta.env.MODE === 'development'
  ? 'http://localhost:8000' // php -S 0:8000 api/index.php
  : `${window.location.origin}/api`

export default function () {
  let copy_btn!: HTMLButtonElement;
  let json_result!: HTMLTextAreaElement;
  let json_viewer!: HTMLDivElement;
  let source!: HTMLDivElement;
  let editor!: HTMLTextAreaElement;

  const [state, setState] = createStore({
    loading: false,
    json: {},
    url: localStorage.getItem('source_url') || 'https://news.ycombinator.com/',
    html: localStorage.getItem('source_html') || '',
    script: localStorage.getItem('script') || initialscript,
  })

  function mountSource() {
    if (source && state.html) {
      const { origin } = new URL(state.url)
      source.innerHTML = `<base href="${origin}"> ${state.html}`
      for (const style of source.findAll('style')) {
        style.remove()
      }
    }
  }

  function appendLog(obj: object) {
    console.log(obj);
    setState('json', obj)
    json_viewer.classList.remove('hidden');
    json_viewer.innerHTML = jsonViewer(obj as {});
    copy_btn.classList.remove('hidden');
    json_result.value = JSON.stringify(obj, null, 2);
  }

  function evalScript() {
    try {
      return new Function('source', 'json', state.script)(source, appendLog)
    } catch (error) {
      if (error instanceof Error) {
        return appendLog({error: error.message})
      }
      return appendLog({ error })
    }
  }

  function copyJsonResult(e: Event) {
    const btn = e.currentTarget as HTMLButtonElement;
    const text = btn.textContent
    json_result.focus();
    json_result.select();
    document.execCommand('copy');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = text
    }, 2000)
  }

  async function getWebSource(e: Event) {
    e.preventDefault()
    setState('loading', true)
    try {
      const response = await fetch(`${CRAWL_SERVER}?url=${state.url}`)
      const text = await response.text()
      setState('url', state.url)
      setState('html', text)
      localStorage.setItem('source_url', state.url)
      localStorage.setItem('source_html', text)
      mountSource()
      evalScript()
    }
    catch (error) {
      alert(error)
    }
    setState('loading', false)
  }

  onMount(() => {
    mountSource()
    if (!state.html) {
      getWebSource(new Event('submit'))
    } else {
      evalScript()
    }
    const codemirror = CodeMirror.fromTextArea(editor, {
      mode: {name: 'javascript', json: true},
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 4,
      theme: 'material-darker',
      extraKeys: {
        "Ctrl-Enter": () => {
          mountSource()
          evalScript()
        }
      }
    })
    codemirror.on('change', cm => {
      setState('script', cm.getValue())
      localStorage.setItem('script', cm.getValue())
    })
    evalScript()
  })
    
  return (
    <>
      <div class="hidden" ref={source}></div>
      <div class="flex min-h-screen bg-dark-800 text-light-800">
        <div class="w-2/3 p-2 pr-0 overflow-auto h-screen relative">
          <textarea class="fixed -left-100" ref={json_result}></textarea>
          <button
            class="absolute right-2"
            classList={{
              hidden: !state.json,
            }}
            onClick={copyJsonResult}
            ref={copy_btn}
          >Copy</button>
          <div
            class="hidden p-1 pb-4 pr-0 rounded bg-dark-300"
            ref={json_viewer}
          ></div>
        </div>
        <div class="w-full flex flex-col">
          <form className="flex p-2" onSubmit={getWebSource}>
            <input
              class="w-full p-2 font-sans rounded bg-dark-300"
              type="text"
              value={state.url}
              placeholder="Source URL"
              onInput={e => setState('url', e.currentTarget.value)}
            />
            <button
              type="submit"
              class="p-2 px-5 ml-2 rounded"
              classList={{
                'cursor-not-allowed': state.loading,
                'bg-gray-700': state.loading,
                'bg-blue-700': !state.loading,
              }}
              disabled={state.loading}
            >
              {state.loading ? 'Loading...' : 'Get'}
            </button>
          </form>
          <div className="p-2 pt-0 w-full h-full rounded">
            <textarea ref={editor}>{state.script}</textarea>
          </div>
        </div>
      </div>
    </>
  );
}