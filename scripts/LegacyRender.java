// Test-only runner. Does not initialize Spring Boot, JPA, or a database connection.
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.WebContext;
import org.thymeleaf.templateresolver.FileTemplateResolver;
import org.thymeleaf.web.servlet.JakartaServletWebApplication;
import org.springframework.mock.web.*;
import org.springframework.security.web.authentication.ui.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

public class LegacyRender {
  public static void main(String[] args) throws Exception {
    Path output=Path.of("test-results/legacy"); Files.createDirectories(output);
    var resolver=new FileTemplateResolver();
    resolver.setPrefix("src/main/resources/templates/"); resolver.setSuffix(".html");
    resolver.setTemplateMode("HTML"); resolver.setCharacterEncoding("UTF-8");
    var engine=new SpringTemplateEngine(); engine.setTemplateResolver(resolver);
    var servletContext=new MockServletContext();
    var req=new MockHttpServletRequest(servletContext); req.setScheme("http"); req.setServerName("localhost"); req.setServerPort(3000);
    var res=new MockHttpServletResponse();
    var exchange=JakartaServletWebApplication.buildApplication(servletContext).buildExchange(req,res);
    for(boolean populated:List.of(false,true)) {
      var context=new WebContext(exchange,Locale.forLanguageTag("pt-BR"));
      var about=new HashMap<String,Object>();
      // Read exactly the existing Java default paragraphs without creating an AboutService or repository.
      String source=Files.readString(Path.of("src/main/java/com/djviee/site/service/AboutService.java"));
      for(int i=1;i<=3;i++) {
        var block=java.util.regex.Pattern.compile("about.setParagraph"+i+"\\(([\\s\\S]*?)\\);").matcher(source); block.find();
        var strings=java.util.regex.Pattern.compile("\"([^\"]*)\"").matcher(block.group(1));
        StringBuilder paragraph=new StringBuilder(); while(strings.find()) paragraph.append(strings.group(1));
        about.put("paragraph"+i,paragraph.toString());
      }
      about.put("updatedAt",populated?LocalDateTime.of(2026,9,4,12,30):null);
      context.setVariable("about",about); context.setVariable("username","visual-test");
      context.setVariable("successMessage",null); context.setVariable("errorMessage",null);
      var musics=new ArrayList<Map<String,Object>>(); var events=new ArrayList<Map<String,Object>>();
      if(populated) {
        for(int i=1;i<=6;i++) musics.add(Map.of("id",i,"title","TESTE ISOLADO "+i,"artists","TESTE AUTOMATIZADO","youtubeUrl","https://youtu.be/abcdefghijk","youtubeVideoId","abcdefghijk","position",i));
        var event=new HashMap<String,Object>(); event.put("id",1);event.put("title","TESTE ISOLADO");event.put("eventDate",LocalDate.of(2026,9,4));event.put("location","Local de teste");event.put("city","Cidade de teste");event.put("description","Descrição usada apenas na comparação automatizada."); events.add(event);
      }
      context.setVariable("musics",musics); context.setVariable("events",events);
      for(String template:List.of("index","admin/dashboard","admin/sobre","admin/musicas","admin/eventos","admin/conta")) {
        String rendered=engine.process(template,context);
        Files.writeString(output.resolve(template.replace('/','-')+(populated?"-populated":"-empty")+".html"),rendered);
      }
    }
    var login=new DefaultLoginPageGeneratingFilter(new UsernamePasswordAuthenticationFilter());
    login.setAuthenticationUrl("/login");
    req.setMethod("GET");req.setRequestURI("/login");
    var loginRes=new MockHttpServletResponse();login.doFilter(req,loginRes,new MockFilterChain());
    Files.writeString(output.resolve("login.html"),loginRes.getContentAsString());
    var logout=new DefaultLogoutPageGeneratingFilter();
    req.setRequestURI("/logout");var logoutRes=new MockHttpServletResponse();logout.doFilter(req,logoutRes,new MockFilterChain());
    Files.writeString(output.resolve("logout.html"),logoutRes.getContentAsString());
    try(var css=LegacyRender.class.getClassLoader().getResourceAsStream("org/springframework/security/default-ui.css")) {
      Files.copy(css,Path.of("public/default-ui.css"),StandardCopyOption.REPLACE_EXISTING);
    }
    System.out.println("Rendered original templates and Spring Security screens without Spring Boot/database.");
  }
}
