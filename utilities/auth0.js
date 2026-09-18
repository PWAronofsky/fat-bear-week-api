const { auth } = require("express-oauth2-jwt-bearer")
const { DEFAULT_LEAGUE_ID } = require("./utilities")

const USERNAME_CLAIM = "https://fatbearweek-api/username"

// Validates Auth0-issued access tokens (Authorization: Bearer <token>) against
// this API's tenant/audience, and attaches the decoded token to req.auth.
exports.checkJwt = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE
})

// Must run after checkJwt. Derives the app-facing user identity entirely from
// the verified token — no local user record. userId is the Auth0 sub, and
// username comes from a custom claim (see the tenant's post-login Action).
exports.loadAuth0User = function(req, res, next) {
  req.apiUser = {
    _id: req.auth.payload.sub,
    username: req.auth.payload[USERNAME_CLAIM],
    leagueId: DEFAULT_LEAGUE_ID
  }
  next()
}
