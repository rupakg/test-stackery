'use strict';

// sent by Stackery
const DOCKER_TASK_ARN = process.env.DOCKER_TASK_ARN;
const DOCKER_TASK_SUBNETS = process.env.DOCKER_TASK_SUBNETS;

const ECS_CLUSTER_NAME = 'default'; // process.env.ECS_CLUSTER_NAME;
const ECS_TASK_DEFINITION = 'stackery-156497753425579-dockerTaskA26298F2-XN7H6VY0F8W:1'; // process.env.ECS_TASK_DEFINITION;
// const ECS_TASK_VPC_SUBNET_1 = process.env.ECS_TASK_VPC_SUBNET_1;
// const ECS_TASK_VPC_SUBNET_2 = process.env.ECS_TASK_VPC_SUBNET_2;
const OUTPUT_S3_PATH = 'stackery-156497753425579-objectstore16b4761a'; // process.env.OUTPUT_S3_PATH;
const OUTPUT_S3_AWS_REGION = 'us-east-1'; // process.env.OUTPUT_S3_AWS_REGION;

const ecsApi = require('./ecs');

module.exports.handler = function handler (event, context, callback) {
  
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const eventName = event.Records[0].eventName;

  // only process S3 ObjectCreated events
  if (!eventName.includes('ObjectCreated:')) {
    callback(null, {});
    return;
  }

  console.log(JSON.stringify(event));
  console.log(`A new video file '${key}' was uploaded to '${bucket}' for processing.`);

  console.log("ENV: DOCKER_TASK_ARN", DOCKER_TASK_ARN);
  console.log("ENV: DOCKER_TASK_SUBNETS", DOCKER_TASK_SUBNETS);

  // parse the file processing details
  // video file: test_00-08.mp4
  const s3_video_url = `https://s3.amazonaws.com/${bucket}/${key}`;
  const thumbnail_file = 'test.png'; //key.substring(0, key.indexOf('_')) + '.png';
  const frame_pos = '00:01'; //key.substring(key.indexOf('_')+1, key.indexOf('.')).replace('-',':');
  console.log(`Processing file '${s3_video_url}' to extract frame from position '${frame_pos}' to generate thumbnail '${thumbnail_file}'.`);

  runThumbnailGenerateTask(s3_video_url, thumbnail_file, frame_pos);

  callback(null, {});
}

var runThumbnailGenerateTask = (s3_video_url, thumbnail_file, frame_pos) => {

  const docker_subnet_items = DOCKER_TASK_SUBNETS.split(',');
  console.log("docker_subnet_items", docker_subnet_items);

  // run an ECS Fargate task
  const params = {
    cluster: `${ECS_CLUSTER_NAME}`,
    launchType: 'FARGATE',
    taskDefinition: `${ECS_TASK_DEFINITION}`,
    count: 1,
    platformVersion:'LATEST',
    networkConfiguration: {
      awsvpcConfiguration: {
          subnets: `${docker_subnet_items}`,
          assignPublicIp: 'ENABLED'
      }
    },
    overrides: {
      containerOverrides: [
        {
          name: '0',
          environment: [
            {
              name: 'INPUT_VIDEO_FILE_URL',
              value: `${s3_video_url}`
            },
            {
              name: 'OUTPUT_THUMBS_FILE_NAME',
              value: `${thumbnail_file}`
            },
            {
              name: 'POSITION_TIME_DURATION',
              value: `${frame_pos}`
            },
            {
              name: 'OUTPUT_S3_PATH',
              value: `${OUTPUT_S3_PATH}`
            },
            {
              name: 'AWS_REGION',
              value: `${OUTPUT_S3_AWS_REGION}`
            }
          ]
        }
      ]
    }
  };

  ecsApi.runECSTask(params);

}
