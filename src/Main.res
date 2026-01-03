%%raw("import './index.css'")

switch ReactDOM.querySelector("#root") {
| Some(domElement) => {
    let (root, scale, note) = {
      open WebAPI
      open WebAPI.Global
      open Music

      let params = URLSearchParams.fromString(location.search)

      let root = switch params->URLSearchParams.get("root") {
      | Value(root) => Music.urlDecodeNote(root)
      | _ => C
      }

      let scale = switch params->URLSearchParams.get("scale") {
      | Value(scale) => Music.urlDecodeScalePattern(scale)
      | _ => majorScalePattern
      }

      let note = switch params->URLSearchParams.get("note") {
      | Value(note) => Some(Music.urlDecodeNote(note))
      | _ => None
      }

      (root, scale, note)
    }
    ReactDOM.Client.createRoot(domElement)->ReactDOM.Client.Root.render(
      <React.StrictMode>
        <App root scale note />
      </React.StrictMode>,
    )
  }
| None => ()
}
