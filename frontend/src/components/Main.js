import React           from "react";
import {Route, Switch} from "react-router-dom";

const Main = () => (
    <main>
      <Switch>
        <Route exact path="/" component={Pos}/>
      </Switch>
    </main>
);

export default Main;
