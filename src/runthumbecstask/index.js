'use strict';

module.exports.handler = function handler (event, context, callback) {
  
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  console.log(JSON.stringify(event));
  console.log(`A new video file '${key}' was uploaded to '${bucket}' for processing.`);

  // parse the file processing details
  // video file: test_00-08.mp4
  const s3_video_url = `https://s3.amazonaws.com/${bucket}/${key}`;
  const thumbnail_file = 'test.png'; //key.substring(0, key.indexOf('_')) + '.png';
  const frame_pos = '00:01'; //key.substring(key.indexOf('_')+1, key.indexOf('.')).replace('-',':');
  console.log(`Processing file '${s3_video_url}' to extract frame from position '${frame_pos}' to generate thumbnail '${thumbnail_file}'.`);

  console.log("context", context);
  
  callback(null, {});
}
