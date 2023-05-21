#admin1
#$password = 'p'
#C:\Zimmermann\sonar-scanner\bin\sonar-scanner -D'sonar.login=admin' -D"sonar.password=$password"
sonar-scanner \
  -Dsonar.projectKey=film \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=sqp_cffbf69aa447ed6b115035e7526a5a14f90e810d