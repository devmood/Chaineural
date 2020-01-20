package pl.chaineural

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Route
import akka.stream.ActorMaterializer

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.language.postfixOps
import scala.util.{Failure, Success}


object ChaineuralHTTPServerApp extends App {

  import pl.chaineural.restAPI.ChaineuralRouter
  import pl.chaineural.messagesDomains.InformationExchangeDomain.Hyperparameters

  implicit val httpSystem: ActorSystem = ActorSystem("rest-api")
  implicit val materializer: ActorMaterializer = ActorMaterializer()
  implicit val ec: ExecutionContextExecutor = httpSystem.dispatcher

  var hyperparameters: Hyperparameters = _
  val host = "localhost"
  val port = 8080
  val hyperRoutes: Route = new ChaineuralRouter().route()
  val routes: Route = hyperRoutes

  val httpServerFuture: Future[Http.ServerBinding] = Http().bindAndHandle(routes, host, port)
  httpServerFuture onComplete {
    case Success(binding) =>
      println(s"Akka Http Server is UP and is bound to ${binding.localAddress}")
      println("Please kindly provide hyperparameters now!")

    case Failure(e) =>
      println(s"Akka Http server failed to start", e)
      httpSystem.terminate()
  }
}