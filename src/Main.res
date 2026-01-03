%%raw("import './index.css'")

switch ReactDOM.querySelector("#root") {
| Some(domElement) => {
    // Set values from initial url
    // React.useEffect0(() => {
    //   open WebAPI
    //   open WebAPI.Global

    //   let params = URLSearchParams.fromString(location.search)

    //   switch params->URLSearchParams.get("root") {
    //   | Value(root) => setRootNote(_ => Music.urlDecodeNote(root))
    //   | _ => ()
    //   }

    //   switch params->URLSearchParams.get("note") {
    //   | Value(note) => setActiveNote(_ => Some(Music.urlDecodeNote(note)))
    //   | _ => ()
    //   }

    //   switch params->URLSearchParams.get("scale") {
    //   | Value(scale) => setScalePattern(_ => Music.urlDecodeScalePattern(scale))
    //   | _ => ()
    //   }

    //   None
    // })

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
