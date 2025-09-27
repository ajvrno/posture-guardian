pose.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!results.poseLandmarks) return;

  drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
    color: '#00FF00', lineWidth: 2
  });
  drawLandmarks(ctx, results.poseLandmarks, {
    color: '#FF0000', lineWidth: 1
  });

  const lm = results.poseLandmarks;

  const leftShoulder = lm[11], rightShoulder = lm[12];
  const leftHip = lm[23], rightHip = lm[24];
  const leftEar = lm[7], rightEar = lm[8];
  const nose = lm[0];

  const avgShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  const avgHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };

  // 1. Torso angle
  const getAngle = (A, B, C) => {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const CB = { x: B.x - C.x, y: B.y - C.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.hypot(AB.x, AB.y);
    const magCB = Math.hypot(CB.x, CB.y);
    return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
  };
  const torsoAngle = getAngle(avgHip, avgShoulder, nose);

  // 2. Head-forward detection
  const headOffset = Math.abs(nose.x - avgShoulder.x);

  // 3. Shoulder symmetry
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);

  // 4. Shoulders over hips alignment
  const lateralDeviation = Math.abs(avgShoulder.x - avgHip.x);

  // Display values
  ctx.fillStyle = "blue";
  ctx.font = "16px monospace";
  ctx.fillText(`Torso Angle: ${torsoAngle.toFixed(1)}°`, 10, 20);
  ctx.fillText(`Head Offset: ${headOffset.toFixed(2)}`, 10, 40);
  ctx.fillText(`Shoulder Diff: ${shoulderDiff.toFixed(2)}`, 10, 60);
  ctx.fillText(`Lateral Deviation: ${lateralDeviation.toFixed(2)}`, 10, 80);

  ctx.font = "28px sans-serif";
  ctx.textAlign = "center";

  // Slouch detection logic
  const isSlouching =
    torsoAngle < 35 ||          // leaning forward
    headOffset > 0.1 ||         // head in front of shoulders
    shoulderDiff > 0.05 ||      // uneven shoulders
    lateralDeviation > 0.08;    // hips not under shoulders

  ctx.fillStyle = isSlouching ? "red" : "green";
  ctx.fillText(
    isSlouching ? "You're slouching! Sit up straight!" : "Good posture 👍",
    canvas.width / 2, 120
  );

  ctx.textAlign = "left";
});