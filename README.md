# youve-got-this
Webapp that pushes motivational messages

For pushing messages from the command line:
curl --header "Authorization: key=<Google Cloud Messaging API Key>" --header Content-Type:"application/json" https://android.googleapis.com/gcm/send -d "{\"registration_ids\":[\"<Registration endpoint>\"]}"
