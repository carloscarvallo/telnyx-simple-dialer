import React, { useEffect, useRef, useReducer } from "react";

import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";
import MuiAlert from "@material-ui/lab/Alert";

import { AsYouType } from "libphonenumber-js";
import { useSessionStorage } from "react-use";
import { useHistory } from "react-router-dom";
import LZString from "lz-string";

import { TelnyxRTC } from "@telnyx/webrtc";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const initialState = {
  status: "DEFAULT",
  callState: "DEFAULT",
  validNumber: false,
  internalCallState: "",
  numberInput: "",
  severity: "",
  disableCallBtn: true,
  callBtnColor: "primary",
  callBtnText: "Call",
  inboundCall: false,
  inputDisabled: false,
};

function dialerReducer(state, action) {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_VALID":
      return { ...state, validNumber: action.payload };
    case "SET_CALL_STATUS":
      return { ...state, callState: action.payload };
    case "SET_INTERNAL_CALL_STATUS": {
      let severity = "info";
      let callState = "DEFAULT";
      let disableCallBtn = state.disableCallBtn;
      let callBtnColor = state.callBtnColor;
      let callBtnText = state.callBtnText;
      let inboundCall = state.inboundCall;
      let inputDisabled = state.inputDisabled;

      if (
        action.payload === "trying" ||
        action.payload === "early" ||
        action.payload === "hangup" ||
        action.payload === "destroy"
      ) {
        severity = "warning";
      }

      if (action.payload === "active") {
        severity = "success";
        callState = "ACTIVE";
        disableCallBtn = false;
        callBtnColor = "secondary";
        callBtnText = "End Call";
        inboundCall = false;
        inputDisabled = true;
      }

      if (action.payload === "hangup" || action.payload === "destroy") {
        callState = "INACTIVE";
        callBtnColor = "primary";
        callBtnText = "Call";
        inboundCall = false;
        inputDisabled = false;
      }

      if (action.payload === "trying" || action.payload === "ringing") {
        callState = "RINGING";
        callBtnColor = "secondary";
        callBtnText = "Hangup";
      }

      if (action.payload === "ringing") {
        inboundCall = true;
        disableCallBtn = false;
        callBtnText = "Answer";
      }

      return {
        ...state,
        internalCallState: action.payload,
        severity,
        callState,
        disableCallBtn,
        callBtnColor,
        callBtnText,
        inboundCall,
        inputDisabled,
      };
    }
    case "SET_NUMBER": {
      let disableCallBtn = true;
      if (action.payload?.validNumber && state.callState !== "RINGING") {
        disableCallBtn = false;
      }
      return { ...state, ...action.payload, disableCallBtn };
    }
    default:
      throw new Error();
  }
}

const SimpleDialer = () => {
  const [state, dispatch] = useReducer(dialerReducer, initialState);

  const [username] = useSessionStorage("login", "");
  const [password] = useSessionStorage("password", "");

  const client = useRef(null);
  const activeCall = useRef(null);
  const phoneData = useRef(null);

  const classes = useStyles();
  let history = useHistory();

  useEffect(() => {
    try {
      // Initialize the client
      client.current = new TelnyxRTC({
        login: LZString.decompressFromUTF16(username) || "",
        password: LZString.decompressFromUTF16(password) || "",
      });

      client.current.connect();

      client.current.remoteElement = "remoteMedia";

      // Attach event listeners
      client.current
        .on("telnyx.ready", () => {
          dispatch({
            type: "SET_STATUS",
            payload: "READY",
          });
        })
        .on("telnyx.error", () => {
          dispatch({
            type: "SET_STATUS",
            payload: "ERROR",
          });

          history.push("/login");
        })
        // Events are fired on both session and call updates
        // ex: when the session has been established
        // ex: when there's an incoming call
        .on("telnyx.notification", (notification) => {
          if (notification.type === "callUpdate") {
            activeCall.current = notification.call;
            dispatch({
              type: "SET_INTERNAL_CALL_STATUS",
              payload: notification.call.state,
            });
          }
        });
    } catch (error) {
      dispatch({
        type: "SET_STATUS",
        payload: "ERROR",
      });

      history.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    const asYouType = new AsYouType();

    dispatch({
      type: "SET_NUMBER",
      payload: {
        numberInput: asYouType.input(e.target.value),
        validNumber: asYouType.isValid(),
      },
    });
    phoneData.current = asYouType;

    // asYouType.input("+1-213-373-4253") === "+1 213 373 4253";
    // asYouType.getNumber().country === "US";
    // asYouType.getNumber().number === "+12133734253";
    // asYouType.getChars() === "+12133734253";
    // asYouType.getTemplate() === "xx xxx xxx xxxx";
  }

  function handleClick() {
    if (state.inboundCall) {
      return activeCall.current.answer();
    }

    if (state.callState === "ACTIVE" || state.callState === "RINGING") {
      activeCall.current.hangup();
    }

    if (state.callState === "DEFAULT" || state.callState === "INACTIVE") {
      activeCall.current = client.current.newCall({
        // Destination is required and can be a phone number or SIP URI
        destinationNumber: phoneData.current.getNumber().number,
        callerNumber: "+1",
        clientState: "Hello_Deivid",
      });
    }
  }

  console.warn("app state", state);

  return (
    <div className="SimpleDialer">
      <Container component="main" maxWidth="xs">
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="phone"
          label="Phone number"
          name="phone"
          autoFocus
          onChange={handleChange}
          value={state.numberInput}
          disabled={state.inputDisabled}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color={state.callBtnColor}
          disabled={state.disableCallBtn}
          className={classes.submit}
          onClick={handleClick}
        >
          {state.callBtnText}
        </Button>
        {state.internalCallState && (
          <Alert
            severity={state.severity}
          >{`Call state: ${state.internalCallState}`}</Alert>
        )}
      </Container>
    </div>
  );
};

export default SimpleDialer;
