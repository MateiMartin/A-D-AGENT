import { useState } from 'react'
import './App.css'

const services = [
  'Service 1',
  // add more service names as needed
]

function App() {
  const [files, setFiles] = useState([])
  const [name, setName] = useState('')
  const [tag, setTag] = useState(services[0])
  const [content, setContent] = useState('')

  const addFile = () => {
    if (!name) return
    setFiles([...files, { name, tag, content }])
    setName('')
    setContent('')
  }

  return (
    <div className="app">
      <h1>Simple IDE</h1>
      <div className="controls">
        <input
          placeholder="File name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          {services.map((svc) => (
            <option key={svc} value={svc}>{svc}</option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="File contents"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={addFile}>Add File</button>
      <ul className="file-list">
        {files.map((f, idx) => (
          <li key={idx}>
            <strong>{f.name}</strong> [{f.tag}]
            <pre>{f.content}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
