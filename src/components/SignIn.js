import React, { useState } from "react";

import LZString from 'lz-string'

import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

import { useSessionStorage } from "react-use";

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

export default function SignIn() {
  const classes = useStyles();

  const [sipUsername, setSipUsername] = useState("");
  const [sipPassword, setSipPassword] = useState("");

  const [, setUsername] = useSessionStorage("login", "");
  const [, setPassword] = useSessionStorage("password", "");

  function onChangeHandler(e) {
    if (e.target?.id === "email") {
      setSipUsername(e.target.value);
    }

    if (e.target?.id === "password") {
      setSipPassword(e.target.value);
    }
  }

  function onClickHandler() {
    setUsername(LZString.compressToUTF16(sipUsername));
    setPassword(LZString.compressToUTF16(sipPassword));
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Authentication
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="SIP Username"
            name="email"
            autoComplete="email"
            autoFocus
            value={sipUsername}
            onChange={onChangeHandler}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={sipPassword}
            onChange={onChangeHandler}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={onClickHandler}
          >
            Connect
          </Button>
        </form>
      </div>
    </Container>
  );
}
