import React, { useEffect } from "react";

import { Router, Switch, Route } from "react-router-dom";

import { useSessionStorage } from "react-use";

import history from "./history";

import SimpleDialer from "./components/SimpleDialer";
import Login from "./components/SignIn";

function App() {
  const [username] = useSessionStorage("login", "");
  const [password] = useSessionStorage("password", "");

  useEffect(() => {
    if (!username && !password) {
      history.push("/login");
    } else {
      history.push("/dialer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router history={history}>
      <Switch>
        <Route path="/dialer">
          <SimpleDialer />
        </Route>
        <Route path="/login">
          <Login />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
